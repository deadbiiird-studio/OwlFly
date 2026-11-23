import os, zipfile, io, math, random, subprocess, shutil, json, hashlib, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
ROOT=Path('/mnt/data'); OUT=ROOT/'owlfly_cinematic'; OUT.mkdir(exist_ok=True)
ZIP=ROOT/'OwlFly-main.zip'; W,H,FPS,DUR=720,1280,30,14.0
random.seed(1234)
# Search real game assets without assuming repo layout.
assets=[]
if ZIP.exists():
    with zipfile.ZipFile(ZIP) as z:
        for ent in z.infolist():
            n=ent.filename.lower()
            if ent.file_size<4_000_000 and n.endswith(('.png','.webp','.jpg','.jpeg')) and any(s in n for s in ('owl','bird','cloud','building','skyline','sprite')):
                try:
                    im=Image.open(io.BytesIO(z.read(ent))); im.load()
                    assets.append((ent.filename, im.convert('RGBA')))
                except: pass
owl_candidates=[]
for name,im in assets:
    s=name.lower(); w,h=im.size
    if not any(v in s for v in ('owl','bird')): continue
    score=0
    if 'owl' in s:score+=10
    if 'sprite' in s or 'frame' in s or 'flap' in s:score+=5
    if 'icon' in s or 'splash' in s or 'logo' in s:score-=15
    if 38<=w<=1200 and 38<=h<=1200: score+=5
    if 0.45<=w/h<=2.2:score+=7
    if 'wing' in s:score+=3
    owl_candidates.append((score,name,im))
owl_candidates.sort(key=lambda x:x[0], reverse=True)
# Do not accidentally substitute a generic asset if project assets were supplied.
owl_images=[]
for score,name,im in owl_candidates[:9]:
    try:
        alpha=im.getchannel('A'); bb=alpha.getbbox()
        if bb: im=im.crop(bb)
        if im.width/im.height>2.8 or im.height/im.width>2.8:continue
        owl_images.append((name,im))
    except:pass
if owl_images:
    (OUT/'owlfly_source_owl.png').write_bytes(b'')
    owl_images[0][1].save(OUT/'owlfly_source_owl.png')
# Brand presentation font, local available fonts.
font_paths=['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf']
bold_paths=['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf']
def font(size,bold=False):
    ps=bold_paths if bold else font_paths
    for p in ps:
        if Path(p).exists():return ImageFont.truetype(p,int(size))
    return ImageFont.load_default()
F_HUGE=font(115,True); F_SUB=font(31,True); F_SMALL=font(26); F_EYEBROW=font(23,True); F_H1=font(58,True)
# Pre-generate smooth sky and atmosphere so animation remains deterministic.
yy=np.linspace(0,1,H)[:,None,None]
c0=np.array([7,17,36]); c1=np.array([31,41,72]); c2=np.array([78,50,80])
col=np.where(yy<0.55, c0[None,None,:]*(1-yy/.55)+c1[None,None,:]*(yy/.55), c1[None,None,:]*(1-(yy-.55)/.45)+c2[None,None,:]*((yy-.55)/.45))
bg=np.repeat(np.clip(col,0,255).astype('uint8'),W,axis=1)
BACKGROUND=Image.fromarray(bg,'RGB').convert('RGBA')
# Distribute parallax stars deterministically.
stars=[(random.randrange(W),random.randrange(800),random.uniform(.7,2.3),random.uniform(0,math.tau)) for i in range(120)]
clouds=[(random.randrange(-250,1000),random.randint(120,1000),random.uniform(.65,1.55),random.uniform(.4,1.5)) for _ in range(13)]
meteor_particles=[(random.uniform(0,1),random.uniform(-1,1)) for _ in range(24)]
# Simple fallback illustration if the uploaded repo has no usable isolated owl sprite.
def owl_fallback(size,phase):
    S=250; a=Image.new('RGBA',(S,S));d=ImageDraw.Draw(a,'RGBA')
    # broad lifted wing silhouettes follow the rhythm of the flight
    k=math.sin(phase*2*math.pi)
    d.ellipse((20,103-k*19,111,164-k*20),fill=(99,58,47,255),outline=(234,157,91,240),width=5)
    d.ellipse((139,103+k*19,230,164+k*20),fill=(99,58,47,255),outline=(234,157,91,240),width=5)
    d.ellipse((63,45,190,219),fill=(141,85,65,255),outline=(245,182,111,255),width=8)
    d.polygon([(70,85),(48,19),(116,56)],fill=(141,85,65,255),outline=(245,182,111,255))
    d.polygon([(177,85),(202,19),(135,56)],fill=(141,85,65,255),outline=(245,182,111,255))
    d.ellipse((76,105,170,212),fill=(218,172,124,255))
    for xc in (99,153):
        d.ellipse((xc-25,78,xc+23,136),fill=(251,215,159,255))
        d.ellipse((xc-13,86,xc+12,126),fill=(22,31,40,255))
        d.ellipse((xc-7,91,xc-1,100),fill=(255,255,255,255))
    d.polygon([(118,125),(136,125),(127,144)],fill=(245,163,61,255))
    return a.resize((size,size),Image.Resampling.LANCZOS)

def alpha_line(image,text,cy,ff,fill=(255,235,198,255),anchor='mm',stroke=0):
    d=ImageDraw.Draw(image,'RGBA');d.text((W//2,cy),text,font=ff,fill=fill,anchor=anchor,stroke_width=stroke,stroke_fill=(4,14,27,220))
def fade(t,a,b):
    x=max(0,min(1,(t-a)/(b-a)));return x*x*(3-2*x)
def ease(t):
    t=max(0,min(1,t));return 1-(1-t)**3

def render(t):
    frame=BACKGROUND.copy();d=ImageDraw.Draw(frame,'RGBA')
    # under-lit moon and sky haze
    moonx,moony=526,252
    d.ellipse((moonx-100,moony-100,moonx+100,moony+100),fill=(236,182,118,17))
    d.ellipse((moonx-74,moony-74,moonx+74,moony+74),fill=(239,195,135,35))
    d.ellipse((moonx-57,moony-57,moonx+57,moony+57),fill=(246,214,165,212))
    d.ellipse((moonx-63,moony-63,moonx+43,moony+43),fill=(237,207,165,44))
    for i,(x,y,r,p) in enumerate(stars):
        glow=(math.sin(t*1.45+p)+1)/2
        c=int(85+130*glow)
        d.ellipse((x-r,y-r,x+r,y+r),fill=(243,226,196,c))
    # Atmosphere wisps/cloud bank: wide shapes with a muted outline.
    for i,(x0,y0,sz,sp) in enumerate(clouds):
        cx=((x0-t*(18+sp*32)* (1 if i%3 else .65)+W+420)%(W+550))-280
        cy=y0+8*math.sin(t*.65+i)
        cw=148*sz; ch=42*sz
        shade=(121,132,159,34 if i%2 else 48)
        d.ellipse((cx-cw*.70,cy-ch*.6,cx+cw*.3,cy+ch*.8),fill=shade)
        d.ellipse((cx-cw*.35,cy-ch,cx+cw*.65,cy+ch*.75),fill=shade)
        d.ellipse((cx-cw*.96,cy-ch*.13,cx+cw,cy+ch),fill=shade)
    # Receding buildings as deterministic horizontal environment formations.
    world=t*142
    horizon=965
    for depth in range(2):
        speed=.35 if depth==0 else 1.0
        unit=122 if depth==0 else 155
        start=int(world*speed//unit)-2
        for b in range(start,start+int(W/unit)+5):
            rnd=random.Random(9703+b*17+depth*918)
            ww=unit*(.62+rnd.random()*.42)
            height=(230 if depth==0 else 365)*(0.40+rnd.random()*.9)
            x=b*unit-world*speed
            top=horizon-height+(90 if depth==0 else 10)
            col=(28,42,65,185) if depth==0 else (13,27,43,252)
            d.rectangle((x,top,x+ww,H),fill=col)
            if depth==1:
                for xi in range(int(x+14),int(x+ww-10),23):
                    for yi in range(int(top+20),int(min(H-10,top+230)),31):
                        if rnd.random()>.63:d.rectangle((xi,yi,xi+6,yi+10),fill=(232,179,111,83))
    # Critical flight lane is deliberately kept clear of decorative text.
    owl_phase=t*2.9
    intro=ease((t-.4)/1.6)
    fly_end=1-fade(t,10.9,12.7)
    opacity=max(0,min(1,intro*fly_end))
    # Route particles and faint trail, not a second collision indicator.
    ox=235 + 22*math.sin(t*.47) + 15*math.sin(t*1.23)
    oy=600+60*math.sin(t*.83)+17*math.sin(t*2.6)
    if t>10.6:
        ox+=(t-10.6)*120; oy-=(t-10.6)*58
    for j in range(16):
        px=ox-j*16-35; py=oy+12+19*math.sin(t*2+j*.75)
        sz=max(0.8,3.3-j*.17)
        d.ellipse((px-sz,py-sz,px+sz,py+sz),fill=(250,186,100,int(opacity*max(0,94-j*6))))
    # Telegraph moving hazard: lit roofline and gust banners, limited to section.
    tele=fade(t,4.3,5.1)*(1-fade(t,7.6,8.5))
    if tele>0:
        cx=640-(t-4.3)*90
        d.rounded_rectangle((cx-92,430,cx+90,444),6,fill=(247,159,82,int(tele*130)))
        for k in range(3):
            d.arc((cx-97+k*25,372+k*10,cx+24+k*25,458+k*10),170,340,fill=(245,179,111,int(tele*(95-k*22))),width=4)
    # Silhouette/aura behind owl
    if opacity>0:
        rr=99;d.ellipse((ox-rr,oy-rr,ox+rr,oy+rr),fill=(235,157,100,int(10*opacity)))
        size=178
        if owl_images:
            oi=owl_images[int(t*5)%len(owl_images)][1]
            sw,sh=oi.size
            factor=min(size/sw,size/sh)
            sprite=oi.resize((max(1,int(sw*factor)),max(1,int(sh*factor))),Image.Resampling.LANCZOS)
        else:
            sprite=owl_fallback(size,(t*3.6)%1)
        sprite=sprite.rotate(2.5*math.sin(t*2.1),Image.Resampling.BICUBIC,expand=True)
        if opacity<1:
            a=sprite.getchannel('A').point(lambda p:int(p*opacity));sprite.putalpha(a)
        frame.alpha_composite(sprite,(int(ox-sprite.width/2),int(oy-sprite.height/2)))
    # Unusual deterministic discovery moment: falling luminous object.
    if 8.65<t<11.95:
        v=(t-8.65)/3.3
        mx=670-490*v;my=75+535*v
        for j in range(16):
            xx=mx+j*11;yy=my-j*13
            r=17*(1-j/18)
            d.ellipse((xx-r,yy-r,xx+r,yy+r),fill=(255,189,104,int(100*(1-j/16))))
        d.ellipse((mx-17,my-17,mx+17,my+17),fill=(255,229,165,225))
        for a in range(4):
            r=24+a*11; al=int(80*(1-a/4));d.arc((mx-r,my-r,mx+r,my+r),40,290,fill=(255,218,159,al),width=2)
    # Inner border / subtle film-grain and typography plate.
    d.rectangle((25,25,W-25,H-25),outline=(239,197,133,48),width=2)
    d.rectangle((46,65,112,69),fill=(248,187,112,202))
    d.text((129,55),'OWLFLY  /  FIELD NOTES',font=F_SMALL,fill=(235,219,197,162))
    d.text((49,1202),'BUILT FOR THE MOMENT BEFORE THE MOVE',font=font(18,True),fill=(210,215,219,116))
    # Narrative typography establishes an authored, distinctive visual language.
    if t<2.8:
        q=fade(t,.15,.85)*(1-fade(t,2.25,2.75))
        overlay=Image.new('RGBA',(W,H));
        alpha_line(overlay,'NOT ALL SKIES',350,F_H1,(255,229,188,int(q*255)))
        alpha_line(overlay,'STAY STILL.',425,F_H1,(255,229,188,int(q*255)))
        alpha_line(overlay,'A SMALL FLIGHT.  AN UNEXPECTED WORLD.',492,F_SMALL,(228,214,200,int(q*195)))
        frame.alpha_composite(overlay)
    if 4.0<=t<8.5:
        q=fade(t,4.0,4.8)*(1-fade(t,7.75,8.5));overlay=Image.new('RGBA',(W,H))
        alpha_line(overlay,'READ THE SKY.',205,F_H1,(255,225,179,int(q*255)))
        alpha_line(overlay,'EVERY GAP IS A DECISION.',270,F_SMALL,(232,226,216,int(q*190)))
        frame.alpha_composite(overlay)
    if 9.0<=t<11.9:
        q=fade(t,9,9.65)*(1-fade(t,11.15,11.9)); overlay=Image.new('RGBA',(W,H))
        alpha_line(overlay,'WHAT WAS THAT?',259,F_H1,(255,232,198,int(q*255)))
        alpha_line(overlay,'LOOK CLOSER. FLY AGAIN.',324,F_SMALL,(236,223,204,int(q*210)))
        frame.alpha_composite(overlay)
    end=fade(t,11.65,12.6)
    if end:
        ov=Image.new('RGBA',(W,H),(4,13,29,int(end*222)));od=ImageDraw.Draw(ov,'RGBA')
        # Logo line and final brand lockup
        od.ellipse((W//2-76,380,W//2+76,532),outline=(248,188,114,int(end*235)),width=6)
        od.arc((W//2-53,408,W//2+54,502),203,340,fill=(247,201,144,int(end*240)),width=7)
        alpha_line(ov,'OWLFLY',641,F_HUGE,(255,229,185,int(end*255)))
        alpha_line(ov,'FLY  ·  DODGE  ·  DISCOVER',722,F_SUB,(241,208,161,int(end*235)))
        alpha_line(ov,'THE SKY IS ONLY THE BEGINNING',797,F_SMALL,(226,225,221,int(end*200)))
        alpha_line(ov,'owlfly.app',906,font(37,True),(250,191,122,int(end*247)))
        frame.alpha_composite(ov)
    # Clean title-safe region and crisp vertical orientation.
    return frame.convert('RGB')

# Sound design: rendered from reproducible score, not falsely attributed to a connected service.
SR=48000
s=np.arange(int(DUR*SR),dtype=np.float64)/SR
np.random.seed(103)
audio=np.zeros_like(s)
# warm music-pad harmonics with smooth chord voicing in D minor to support a mysterious flight
notes=[[146.83,174.61,220.00],[130.81,164.81,196.00],[116.54,146.83,174.61],[130.81,174.61,220.00]]
for k,ns in enumerate(notes):
    start=k*3.5;end=min(DUR,(k+1)*3.5)
    left=np.clip((s-start)/.65,0,1)
    right=np.clip((end-s)/.85,0,1)
    env=left*right*((s>=start)&(s<=end))
    for j,f in enumerate(ns):
        audio+=.034*env*(np.sin(2*np.pi*f*s+(.03*j)*np.sin(2*np.pi*.15*s))+.21*np.sin(2*np.pi*f*2*s))
# crystalline upstroke motifs, fade in and out
for start,freq in [(1.8,660),(3.2,740),(5.5,587),(7.8,880),(9.75,987),(11.0,1175),(12.3,880)]:
    z=s-start; env=np.where(z>=0, np.exp(-np.maximum(z,0)*4.3)*(1-np.exp(-np.maximum(z,0)*48)),0)
    audio+=.05*env*np.sin(2*np.pi*(freq*z+50*z*z))
# wing-swishes, sky movements and low-frequency accents
for start in np.arange(2.3,11.4,.77):
    z=s-start; env=np.where((z>0)&(z<.36),np.sin(np.pi*np.clip(z/.36,0,1))**2,0)
    noise=np.random.default_rng(int(start*100)).normal(0,1,len(s))
    filt=np.convolve(noise,np.ones(15)/15,'same')
    audio+=.008*env*filt
for start in [4.6,8.9,11.9]:
    z=np.maximum(s-start,0)
    audio+=.058*np.exp(-z*7)*(s>=start)*np.sin(2*np.pi*(76*z+70*z*z))
# 0.3 sec ending fade, safe conservative headroom
fadein=np.clip(s/.25,0,1);fadeout=np.clip((DUR-s)/.5,0,1)
audio*=fadein*fadeout
m=np.max(np.abs(audio));audio=np.clip(audio/max(1,m/.82),-.96,.96)
# Soft stereo motion using sub-millisecond delay.
delay=int(.0028*SR)
stereo=np.stack([audio, np.concatenate([np.zeros(delay),audio[:-delay]])],axis=1)
with wave.open(str(OUT/'owlfly_original_score.wav'),'wb') as wf:
    wf.setnchannels(2);wf.setsampwidth(2);wf.setframerate(SR);wf.writeframes((stereo*32767).astype('<i2').tobytes())

# Poster and editable-source keyframes; SVG and HTML can be imported to design tools.
render(2.8).save(OUT/'owlfly_flight_poster.png',optimize=True)
render(13.2).save(OUT/'owlfly_promo_poster.png',optimize=True)
for n,t in [('01_opening',1.15),('02_flight',3.4),('03_shift',6.15),('04_discovery',10.0),('05_final',13.2)]:
    render(t).save(OUT/(n+'.png'),optimize=True)

ffmpeg=shutil.which('ffmpeg')
if not ffmpeg:
    try:
        import imageio_ffmpeg;ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    except: pass
video_status='skipped_no_ffmpeg'
if ffmpeg:
    outfile=OUT/'OwlFly_Fresh_Cinematic_1080x1920.mp4'
    cmd=[ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-i',str(OUT/'owlfly_original_score.wav'),'-vf','scale=1080:1920:flags=lanczos,format=yuv420p','-c:v','libx264','-preset','medium','-crf','18','-movflags','+faststart','-c:a','aac','-b:a','192k','-t',str(DUR),str(outfile)]
    pr=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for i in range(int(DUR*FPS)):
            pr.stdin.write(render(i/FPS).tobytes())
        pr.stdin.close();errors=pr.stderr.read().decode('utf-8','replace');pr.wait(timeout=100)
    except Exception as e:
        pr.kill();errors=repr(e)
    video_status='passed' if outfile.exists() and outfile.stat().st_size>15000 and pr.returncode==0 else 'render_failed:'+str(errors)[-500:]
# Contact sheet and design package: five frames, each true portrait 9:16
frames=[]
for n in ['01_opening','02_flight','03_shift','04_discovery','05_final']:
    im=Image.open(OUT/(n+'.png')).convert('RGB');im.thumbnail((250,446))
    frames.append(im.copy())
contact=Image.new('RGB',(5*260+20,520),(13,23,39))
for i,im in enumerate(frames):
    x=10+i*260;contact.paste(im,(x,17))
    ImageDraw.Draw(contact).text((x,474),['01 · OPEN','02 · FLIGHT','03 · SHIFT','04 · DISCOVER','05 · BRAND'][i],font=font(18,True),fill=(238,207,171))
contact.save(OUT/'owlfly_storyboard.png')
# HTML preview with frame-step storyboard for simple visual inspection and Figma handoff.
html='''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OwlFly • Cinematic</title><style>body{background:#071323;color:#f9dfb8;font-family:system-ui;text-align:center;padding:2rem}video{width:min(80vw,350px);aspect-ratio:9/16;border:1px solid #b88e5d;border-radius:18px;box-shadow:0 18px 80px #0009}img{width:min(18vw,200px);margin:.25rem;border-radius:9px}a{color:#f9d99b}</style></head><body><h1>OWLFLY <small>· NEW FLIGHT</small></h1><p>Flight / readability / discovery. Vertical cinematic, 14 seconds.</p><video controls autoplay muted playsinline loop src="OwlFly_Fresh_Cinematic_1080x1920.mp4"></video><h2>Editable storyboard frames</h2><div>'''+''.join(f'<img src="{n}.png" alt="Scene {n}">' for n in ['01_opening','02_flight','03_shift','04_discovery','05_final'])+'''</div><p><a href="owlfly_original_score.wav">Original audio stem</a></p></body></html>'''
(OUT/'index.html').write_text(html,encoding='utf-8')
manifest={'video_status':video_status,'frames':int(DUR*FPS),'fps':FPS,'duration_seconds':DUR,'resolution':'1080x1920','video':str(OUT/'OwlFly_Fresh_Cinematic_1080x1920.mp4'),'source_owl_assets':[n for n,im in owl_images], 'game_assets_found':[name for name,im in assets][:75], 'note':'Original score generated locally; not from ElevenLabs. Figma files not created by local rendering.', 'files':[]}
for p in sorted(OUT.iterdir()):
    if p.is_file() and p.name!='manifest.json':manifest['files'].append({'name':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()[:16]})
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'status':video_status,'owl_sprite_source':manifest['source_owl_assets'][:3],'files':[(x['name'],x['bytes']) for x in manifest['files']]},indent=2))
