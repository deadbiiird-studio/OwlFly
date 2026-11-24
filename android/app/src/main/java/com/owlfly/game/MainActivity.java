package com.owlfly.game;

import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String AUDIO_TAG = "OwlFlyAudioGate";
    private boolean activityResumed = false;
    private boolean audioActive = false;
    private long audioEpoch = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // The bundled game can play its one-shot launch cue without a tap.
        // External browsers retain their own autoplay policy.
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
            setNativeAudioMuted(getBridge().getWebView(), true);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        activityResumed = true;
        signalActivity(hasWindowFocus());
    }

    @Override
    public void onPause() {
        activityResumed = false;
        signalActivity(false);
        super.onPause();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        signalActivity(activityResumed && hasFocus);
    }

    @Override
    public void onStop() {
        activityResumed = false;
        signalActivity(false);
        super.onStop();
    }

    @Override
    public void onDestroy() {
        activityResumed = false;
        signalActivity(false);
        super.onDestroy();
    }

    private void setNativeAudioMuted(WebView webView, boolean muted) {
        if (WebViewFeature.isFeatureSupported(WebViewFeature.MUTE_AUDIO)) {
            try {
                WebViewCompat.setAudioMuted(webView, muted);
                Log.i(AUDIO_TAG, "native muted=" + WebViewCompat.isAudioMuted(webView));
            } catch (RuntimeException error) {
                Log.w(AUDIO_TAG, "native mute failed; JS lifecycle gate remains active", error);
            }
        } else {
            Log.i(AUDIO_TAG, "native mute unsupported; using JS lifecycle gate");
        }
    }

    private void signalActivity(boolean active) {
        audioActive = active;
        final long epoch = ++audioEpoch;
        if (getBridge() == null || getBridge().getWebView() == null) return;
        final WebView webView = getBridge().getWebView();
        Log.i(AUDIO_TAG, "active=" + active + " epoch=" + epoch);

        // Silence native WebView output before depending on the renderer's JS queue.
        if (!active) setNativeAudioMuted(webView, true);
        webView.evaluateJavascript(
            "window.__owlflyNativeActive=" + active +
            ";window.dispatchEvent(new Event('owlfly-native-activity'));", result -> {
                // A late foreground callback must never undo a newer background mute.
                if (active && audioActive && epoch == audioEpoch) {
                    setNativeAudioMuted(webView, false);
                }
            });
    }
}
