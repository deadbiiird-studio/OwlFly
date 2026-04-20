from PIL import Image, ImageDraw
import os

icons_dir = "web/public/assets/icons"
os.makedirs(icons_dir, exist_ok=True)

def make_png(size, name):
    img = Image.new("RGBA", (size, size), (15, 20, 40, 255))
    d = ImageDraw.Draw(img)
    d.ellipse((size*0.18, size*0.18, size*0.82, size*0.82), fill=(60, 240, 160, 255))
    d.text((size*0.40, size*0.38), "O", fill=(0, 0, 0, 180))
    img.save(os.path.join(icons_dir, name))

make_png(192, "icon-192.png")
make_png(512, "icon-512.png")

# favicon.ico at web/public/favicon.ico
os.makedirs("web/public", exist_ok=True)
base = Image.open(os.path.join(icons_dir, "icon-512.png")).convert("RGBA")
base.save("web/public/favicon.ico", sizes=[(16,16),(32,32),(48,48),(64,64)])

print("Wrote:")
print(" -", os.path.abspath(os.path.join(icons_dir, "icon-192.png")))
print(" -", os.path.abspath(os.path.join(icons_dir, "icon-512.png")))
print(" -", os.path.abspath("web/public/favicon.ico"))
