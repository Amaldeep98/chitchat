# WebRTC Calling with ngrok - Complete Setup Guide

## 🚀 Overview

This guide shows how to test WebRTC calling between different browsers/devices using ngrok for HTTPS tunneling.

### **🔧 Setup Complete:**

✅ **ngrok Tunnel**: `https://b16584797980.ngrok-free.app`  
✅ **Server Updated**: CORS configured for ngrok  
✅ **Client Updated**: Dynamic API/Socket URLs  
✅ **Backend Running**: Port 5000 with ngrok support

## 📱 How to Test WebRTC Calling

### **Step 1: Access the App**

**Primary URL (ngrok HTTPS)**: `https://b16584797980.ngrok-free.app`  
**Local URL**: `http://localhost:3000`  
**Network URL**: `http://192.168.0.102:3000`

### **Step 2: Test Between Different Browsers**

#### **Browser 1 (Chrome):**

1. Open: `https://b16584797980.ngrok-free.app`
2. Login with account 1
3. Go to chat with another user
4. Click the call button

#### **Browser 2 (Firefox/Edge):**

1. Open: `https://b16584797980.ngrok-free.app`
2. Login with account 2 (different user)
3. Go to chat with the first user
4. Answer the incoming call

### **Step 3: Test Between Different Devices**

#### **Device 1 (Computer):**

1. Open: `https://b16584797980.ngrok-free.app`
2. Login and start a call

#### **Device 2 (Phone/Tablet):**

1. Open: `https://b16584797980.ngrok-free.app`
2. Login with different account
3. Answer the call

## 🔧 Technical Details

### **How It Works:**

1. **ngrok Tunnel**: Provides HTTPS access to React app (port 3000)
2. **API Calls**: Client detects ngrok hostname → uses localhost:5000 for API
3. **Socket.io**: Client detects ngrok hostname → uses localhost:5000 for Socket.io
4. **WebRTC**: Works over HTTPS (ngrok) between different browsers/devices

### **Dynamic URL Configuration:**

```javascript
// API URL Logic
if (hostname.includes("ngrok-free.app")) {
  return "http://localhost:5000/api"; // Use localhost for API
}

// Socket.io URL Logic
if (hostname.includes("ngrok-free.app")) {
  return "http://localhost:5000"; // Use localhost for Socket.io
}
```

### **CORS Configuration:**

```javascript
// Server accepts requests from:
origin: [
  "https://b16584797980.ngrok-free.app", // Specific ngrok URL
  /^https:\/\/.*\.ngrok-free\.app$/, // Any ngrok URL
];
```

## 🎯 Testing Scenarios

### **Scenario 1: Same Computer, Different Browsers**

- **Browser 1**: Chrome → `https://b16584797980.ngrok-free.app`
- **Browser 2**: Firefox → `https://b16584797980.ngrok-free.app`
- **Expected**: WebRTC call should work

### **Scenario 2: Different Devices**

- **Computer**: `https://b16584797980.ngrok-free.app`
- **Phone**: `https://b16584797980.ngrok-free.app`
- **Expected**: WebRTC call should work

### **Scenario 3: Local Network + ngrok**

- **Device 1**: `https://b16584797980.ngrok-free.app`
- **Device 2**: `http://192.168.0.102:3000` (local network)
- **Expected**: May not work (mixed HTTPS/HTTP)

## 🔍 Debug Information

### **Check Console Logs:**

1. **Open Browser Console**: F12 → Console
2. **Look for these logs**:
   ```
   Socket connected: [socket-id]
   📞 Starting call: {type: "voice", userId: "...", socketConnected: true}
   🎥 Requesting media with constraints: {audio: true, video: true}
   ✅ Media stream obtained successfully
   ```

### **Check Network Tab:**

1. **Open Network Tab**: F12 → Network
2. **Look for**:
   - API calls to `localhost:5000`
   - Socket.io connections to `localhost:5000`
   - WebRTC ICE candidates

### **Check ngrok Status:**

```bash
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

## 🚨 Troubleshooting

### **Issue 1: "Cannot connect to server"**

- **Cause**: Backend server not running
- **Fix**: Start server: `cd server && node index.js`

### **Issue 2: "Camera/microphone access denied"**

- **Cause**: Browser permissions
- **Fix**: Allow camera/microphone access

### **Issue 3: "WebRTC not supported"**

- **Cause**: Browser doesn't support WebRTC
- **Fix**: Use modern browser (Chrome, Firefox, Edge)

### **Issue 4: Call not connecting**

- **Cause**: NAT/Firewall issues
- **Fix**: Check STUN servers in `webrtc.ts`

## 🎉 Expected Results

### **Successful Call:**

- ✅ **Audio**: Both users can hear each other
- ✅ **Video**: Both users can see each other (if video call)
- ✅ **Timer**: Call duration timer works
- ✅ **Controls**: Mute/unmute, video on/off work
- ✅ **End Call**: Call ends properly

### **Call Features:**

- **Voice Calls**: Audio only
- **Video Calls**: Audio + Video
- **Call Timer**: Shows duration
- **Mute/Unmute**: Toggle microphone
- **Video On/Off**: Toggle camera
- **End Call**: Terminate call

## 📞 Ready to Test!

**Access**: `https://b16584797980.ngrok-free.app`  
**Backend**: Running on `localhost:5000`  
**ngrok**: Active tunnel for HTTPS access

**Test the calling feature between different browsers/devices!** 🚀

