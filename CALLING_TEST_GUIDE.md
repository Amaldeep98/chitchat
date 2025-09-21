# Testing Calling Feature on Local Network

## 🚀 Quick Setup Guide

### 1. **Current Network Configuration**

- **Your IP Address**: `192.168.0.102`
- **Frontend URL**: `http://192.168.0.102:3000`
- **Backend URL**: `http://192.168.0.102:5000`

### 2. **Testing Steps**

#### **Step 1: Access from Different Devices**

1. **On your computer**: Open `http://192.168.0.102:3000`
2. **On mobile/tablet**: Connect to same WiFi and open `http://192.168.0.102:3000`
3. **On another computer**: Same WiFi network, same URL

#### **Step 2: Test Calling Feature**

1. **Create two user accounts** (or use existing ones)
2. **Login on both devices** with different accounts
3. **Add each other as friends**
4. **Start a chat** between the two users
5. **Click the call button** (phone/video icon) in the chat

### 3. **WebRTC Configuration**

#### **What's Configured:**

- ✅ **Multiple STUN servers** for better connectivity
- ✅ **Local network support** (192.168.x.x addresses)
- ✅ **Secure context detection** for localhost/192.168.x.x
- ✅ **Enhanced error handling** for media access
- ✅ **CORS configuration** for network access

#### **STUN Servers Used:**

- Google STUN servers (stun.l.google.com)
- Additional public STUN servers for redundancy
- ICE candidate pool size increased to 10

### 4. **Troubleshooting**

#### **If WebRTC doesn't work:**

1. **Check Browser Console**:

   ```javascript
   // Open browser console and check for:
   console.log("WebRTC support:", !!window.RTCPeerConnection);
   console.log("MediaDevices support:", !!navigator.mediaDevices);
   ```

2. **Check Media Permissions**:

   - Allow camera/microphone access when prompted
   - Check browser settings for media permissions

3. **Network Issues**:

   - Ensure both devices are on the same WiFi network
   - Check firewall settings (ports 3000, 5000 should be open)
   - Try disabling VPN if active

4. **Browser Compatibility**:
   - **Chrome/Edge**: Full WebRTC support
   - **Firefox**: Full WebRTC support
   - **Safari**: Limited WebRTC support (may need HTTPS)

### 5. **Advanced Testing**

#### **For Better Connectivity (Optional):**

If you have issues with calling, you can set up a local TURN server:

1. **Install coturn**:

   ```bash
   sudo apt install coturn
   ```

2. **Configure coturn**:

   ```bash
   sudo nano /etc/turnserver.conf
   ```

3. **Add to WebRTC config**:
   ```javascript
   { urls: 'turn:192.168.0.102:3478', username: 'user', credential: 'pass' }
   ```

### 6. **Testing Checklist**

- [ ] Both devices can access `http://192.168.0.102:3000`
- [ ] Both devices can login/create accounts
- [ ] Both devices can add each other as friends
- [ ] Both devices can send messages in chat
- [ ] Both devices can see the call button
- [ ] Camera/microphone permissions are granted
- [ ] Call initiation works (outgoing call)
- [ ] Call acceptance works (incoming call)
- [ ] Audio/video streams are working
- [ ] Call termination works

### 7. **Expected Behavior**

1. **Call Initiation**: Click call button → Other device receives call notification
2. **Call Acceptance**: Click accept → Both devices should show video/audio
3. **Call Rejection**: Click reject → Call ends, caller notified
4. **Call End**: Click end call → Both devices return to chat

### 8. **Debug Information**

Check browser console for these logs:

- `🔐 Encryption initialized:` - Encryption system working
- `🎥 Requesting media with constraints:` - Media access attempt
- `✅ Media stream obtained successfully` - Camera/mic working
- `📞 Starting call:` - Call initiation
- `📞 Call accepted:` - Call acceptance

---

## 🎯 Quick Test Commands

```bash
# Check if services are running
curl http://192.168.0.102:3000
curl http://192.168.0.102:5000/api/health

# Check network connectivity
ping 192.168.0.102

# Check if ports are open
netstat -tlnp | grep -E ":(3000|5000)"
```

**Happy Testing! 🎉**

