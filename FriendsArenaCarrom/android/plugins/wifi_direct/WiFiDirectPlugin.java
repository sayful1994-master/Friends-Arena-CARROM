package com.friendsarena.carrom.wifidirect;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.wifi.p2p.WifiP2pConfig;
import android.net.wifi.p2p.WifiP2pDevice;
import android.net.wifi.p2p.WifiP2pDeviceList;
import android.net.wifi.p2p.WifiP2pInfo;
import android.net.wifi.p2p.WifiP2pManager;
import android.util.Log;
import androidx.annotation.NonNull;
import org.godotengine.godot.Godot;
import org.godotengine.godot.plugin.GodotPlugin;
import org.godotengine.godot.plugin.SignalInfo;
import org.godotengine.godot.plugin.UsedByGodot;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

/**
 * Android Native Wi-Fi Direct (P2P) Plugin for Godot 4.
 * Enables off-grid multiplayer discovery and socket negotiation.
 */
public class WiFiDirectPlugin extends GodotPlugin {
    private static final String TAG = "WiFiDirectPlugin";
    private WifiP2pManager manager;
    private WifiP2pManager.Channel channel;
    private BroadcastReceiver receiver;
    private IntentFilter intentFilter;

    public WiFiDirectPlugin(Godot godot) {
        super(godot);
    }

    @NonNull
    @Override
    public String getPluginName() {
        return "WiFiDirectPlugin";
    }

    @NonNull
    @Override
    public Set<SignalInfo> getPluginSignals() {
        Set<SignalInfo> signals = new HashSet<>();
        signals.add(new SignalInfo("onPeersDiscovered", String.class));
        signals.add(new SignalInfo("onConnected", String.class, Boolean.class));
        signals.add(new SignalInfo("onDisconnected"));
        signals.add(new SignalInfo("onError", String.class));
        return signals;
    }

    @Override
    public void onMainCreate(Activity activity) {
        super.onMainCreate(activity);
        manager = (WifiP2pManager) activity.getSystemService(Context.WIFI_P2P_SERVICE);
        if (manager != null) {
            channel = manager.initialize(activity, activity.getMainLooper(), null);
        }
        setupIntentFilter();
    }

    private void setupIntentFilter() {
        intentFilter = new IntentFilter();
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION);
    }

    @UsedByGodot
    public void discoverPeers() {
        if (manager == null || channel == null) {
            emitSignal("onError", "Wi-Fi P2P not supported on this hardware.");
            return;
        }
        manager.discoverPeers(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "Peer discovery started successfully.");
            }

            @Override
            public void onFailure(int reasonCode) {
                emitSignal("onError", "Peer discovery failed with code: " + reasonCode);
            }
        });
    }

    @UsedByGodot
    public void connectToDevice(String deviceAddress) {
        if (manager == null || channel == null) return;
        WifiP2pConfig config = new WifiP2pConfig();
        config.deviceAddress = deviceAddress;
        manager.connect(channel, config, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "Connection initiation successful.");
            }

            @Override
            public void onFailure(int reason) {
                emitSignal("onError", "Failed to connect to peer: " + reason);
            }
        });
    }
}
