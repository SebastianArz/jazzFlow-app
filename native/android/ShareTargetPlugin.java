package com.sebastianarz.jazzflow;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * ShareTarget – nimmt Dateien/Text an, die ueber "Teilen" an JazzFlow geschickt
 * werden (z. B. iReal-Pro-Export als .html). Die Web-App holt den Inhalt mit
 * ShareTarget.consume() ab und bekommt bei laufender App das Ereignis
 * "shareReceived". Es wird nichts gespeichert und nichts verschickt.
 */
@CapacitorPlugin(name = "ShareTarget")
public class ShareTargetPlugin extends Plugin {

    private static final int MAX_BYTES = 5 * 1024 * 1024; // 5 MB reichen fuer grosse Playlists
    private static final String CONSUMED = "com.sebastianarz.jazzflow.SHARE_CONSUMED";

    private String pendingText = null;
    private String pendingType = null;

    @Override
    public void load() {
        // App wurde ueber "Teilen" gestartet -> Inhalt merken, JS holt ihn per consume()
        handleIntent(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        // App lief schon -> Inhalt merken + Web-App benachrichtigen
        if (handleIntent(intent)) {
            notifyListeners("shareReceived", new JSObject(), true);
        }
    }

    @SuppressWarnings("deprecation")
    private boolean handleIntent(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return false;
        String text = null;
        try {
            Object extra = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (extra instanceof Uri) text = readUri((Uri) extra);
        } catch (Exception e) {
            text = null;
        }
        if (text == null) {
            CharSequence cs = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            if (cs != null) text = cs.toString();
        }
        intent.setAction(CONSUMED); // nicht doppelt verarbeiten (z. B. nach Drehen)
        if (text == null || text.isEmpty()) return false;
        pendingText = text;
        pendingType = intent.getType();
        return true;
    }

    private String readUri(Uri uri) throws Exception {
        try (InputStream in = getContext().getContentResolver().openInputStream(uri)) {
            if (in == null) return null;
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int total = 0;
            int n;
            while ((n = in.read(buf)) != -1) {
                total += n;
                if (total > MAX_BYTES) return null;
                out.write(buf, 0, n);
            }
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    @PluginMethod
    public void consume(PluginCall call) {
        JSObject r = new JSObject();
        if (pendingText != null) {
            r.put("text", pendingText);
            r.put("type", pendingType);
        }
        pendingText = null;
        pendingType = null;
        call.resolve(r);
    }
}
