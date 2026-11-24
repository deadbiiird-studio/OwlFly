package com.owlfly.game;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean activityResumed = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // The bundled game can play its one-shot launch cue without a tap.
        // External browsers retain their own autoplay policy.
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
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

    private void signalActivity(boolean active) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        getBridge().getWebView().evaluateJavascript(
            "window.__owlflyNativeActive=" + active +
            ";window.dispatchEvent(new Event('owlfly-native-activity'));", null);
    }
}
