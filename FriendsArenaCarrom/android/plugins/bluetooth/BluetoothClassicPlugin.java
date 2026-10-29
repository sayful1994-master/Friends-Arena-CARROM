package com.friendsarena.carrom.bluetooth;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothServerSocket;
import android.bluetooth.BluetoothSocket;
import android.util.Log;
import androidx.annotation.NonNull;
import org.godotengine.godot.Godot;
import org.godotengine.godot.plugin.GodotPlugin;
import org.godotengine.godot.plugin.SignalInfo;
import org.godotengine.godot.plugin.UsedByGodot;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Android Native Bluetooth Classic (RFCOMM) Socket Plugin for Godot 4.
 * Enables zero-internet local multiplayer over Bluetooth.
 */
public class BluetoothClassicPlugin extends GodotPlugin {
    private static final String TAG = "BluetoothPlugin";
    private static final UUID MY_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB"); // Standard SPP UUID
    private BluetoothAdapter bluetoothAdapter;
    private AcceptThread acceptThread;
    private ConnectedThread connectedThread;

    public BluetoothClassicPlugin(Godot godot) {
        super(godot);
    }

    @NonNull
    @Override
    public String getPluginName() {
        return "BluetoothPlugin";
    }

    @NonNull
    @Override
    public Set<SignalInfo> getPluginSignals() {
        Set<SignalInfo> signals = new HashSet<>();
        signals.add(new SignalInfo("onDeviceDiscovered", String.class, String.class));
        signals.add(new SignalInfo("onConnected", String.class, Boolean.class));
        signals.add(new SignalInfo("onDisconnected", String.class));
        signals.add(new SignalInfo("onDataReceived", byte[].class));
        signals.add(new SignalInfo("onError", Integer.class, String.class));
        return signals;
    }

    @Override
    public void onMainCreate(Activity activity) {
        super.onMainCreate(activity);
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
    }

    @UsedByGodot
    public void startServer(String serviceName) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            emitSignal("onError", 1001, "Bluetooth adapter not available or disabled.");
            return;
        }
        if (acceptThread != null) {
            acceptThread.cancel();
        }
        acceptThread = new AcceptThread(serviceName);
        acceptThread.start();
    }

    @UsedByGodot
    public void connectToAddress(String address) {
        if (bluetoothAdapter == null) return;
        BluetoothDevice device = bluetoothAdapter.getRemoteDevice(address);
        new Thread(() -> {
            try {
                BluetoothSocket socket = device.createRfcommSocketToServiceRecord(MY_UUID);
                bluetoothAdapter.cancelDiscovery();
                socket.connect();
                connectedThread = new ConnectedThread(socket);
                connectedThread.start();
                emitSignal("onConnected", address, false);
            } catch (IOException e) {
                emitSignal("onError", 1002, "Failed to connect: " + e.getMessage());
            }
        }).start();
    }

    @UsedByGodot
    public void sendBytes(byte[] data) {
        if (connectedThread != null) {
            connectedThread.write(data);
        }
    }

    private class AcceptThread extends Thread {
        private final BluetoothServerSocket serverSocket;

        public AcceptThread(String name) {
            BluetoothServerSocket tmp = null;
            try {
                tmp = bluetoothAdapter.listenUsingRfcommWithServiceRecord(name, MY_UUID);
            } catch (IOException e) {
                Log.e(TAG, "Socket listen() failed", e);
            }
            serverSocket = tmp;
        }

        public void run() {
            BluetoothSocket socket = null;
            try {
                if (serverSocket != null) {
                    socket = serverSocket.accept();
                    if (socket != null) {
                        connectedThread = new ConnectedThread(socket);
                        connectedThread.start();
                        emitSignal("onConnected", socket.getRemoteDevice().getAddress(), true);
                        serverSocket.close();
                    }
                }
            } catch (IOException e) {
                Log.e(TAG, "Socket accept() failed", e);
            }
        }

        public void cancel() {
            try {
                if (serverSocket != null) serverSocket.close();
            } catch (IOException e) {
                Log.e(TAG, "Socket close() failed", e);
            }
        }
    }

    private class ConnectedThread extends Thread {
        private final BluetoothSocket socket;
        private final InputStream inStream;
        private final OutputStream outStream;

        public ConnectedThread(BluetoothSocket socket) {
            this.socket = socket;
            InputStream tmpIn = null;
            OutputStream tmpOut = null;
            try {
                tmpIn = socket.getInputStream();
                tmpOut = socket.getOutputStream();
            } catch (IOException e) {
                Log.e(TAG, "Error getting streams", e);
            }
            inStream = tmpIn;
            outStream = tmpOut;
        }

        public void run() {
            byte[] buffer = new byte[1024];
            int bytes;
            while (true) {
                try {
                    bytes = inStream.read(buffer);
                    if (bytes > 0) {
                        byte[] payload = new byte[bytes];
                        System.arraycopy(buffer, 0, payload, 0, bytes);
                        emitSignal("onDataReceived", payload);
                    }
                } catch (IOException e) {
                    emitSignal("onDisconnected", "Stream disconnected: " + e.getMessage());
                    break;
                }
            }
        }

        public void write(byte[] bytes) {
            try {
                outStream.write(bytes);
            } catch (IOException e) {
                Log.e(TAG, "Error writing data", e);
            }
        }
    }
}
