const socket = io();
let peerConnection;
let stream;
const roomIdInput = document.getElementById('roomIdInput');

function joinStream() {
    const roomId = roomIdInput.value.trim();
    if (!roomId) {
        alert('Bitte gib eine Raum-ID ein');
        return;
    }

    socket.emit('join-as-viewer', roomId);
    updateStatus('Verbinde...', false);
}

function leaveStream() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    if (stream) {
        const video = document.getElementById('streamVideo');
        video.srcObject = null;
        stream = null;
    }
    
    document.getElementById('noStream').style.display = 'flex';
    document.getElementById('streamMessage').textContent = 'Gib eine Raum-ID ein, um einen Stream anzusehen';
    updateStatus('Nicht verbunden', false);
    roomIdInput.disabled = false;
    roomIdInput.value = '';
}

function toggleFullscreen() {
    const container = document.querySelector('.stream-container');
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.error('Vollbild-Fehler:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

function toggleAudio() {
    const video = document.getElementById('streamVideo');
    video.muted = !video.muted;
    const btn = document.querySelector('.viewer-controls .btn:nth-child(2)');
    btn.innerHTML = video.muted ? 
        '<i class="fas fa-volume-mute"></i> Ton aus' : 
        '<i class="fas fa-volume-up"></i> Ton an';
}

// Socket.io Event Handler
socket.on('room-not-found', () => {
    alert('Raum nicht gefunden. Bitte überprüfe die Raum-ID.');
    updateStatus('Raum nicht gefunden', false);
});

socket.on('offer', async (data) => {
    try {
        peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        peerConnection.ontrack = (event) => {
            const video = document.getElementById('streamVideo');
            video.srcObject = event.streams[0];
            stream = event.streams[0];
            document.getElementById('noStream').style.display = 'none';
            updateStatus('Streaming läuft', true);
            roomIdInput.disabled = true;
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    target: data.sender,
                    candidate: event.candidate
                });
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log('Verbindungsstatus:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'disconnected' || 
                peerConnection.connectionState === 'failed') {
                leaveStream();
            }
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('answer', {
            target: data.sender,
            sdp: answer
        });

    } catch (err) {
        console.error('Fehler bei der Peer-Verbindung:', err);
        alert('Fehler beim Verbinden mit dem Stream: ' + err.message);
        leaveStream();
    }
});

socket.on('answer', async (data) => {
    if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    }
});

socket.on('ice-candidate', async (data) => {
    if (peerConnection) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
            console.error('Fehler beim Hinzufügen des ICE-Kandidaten:', err);
        }
    }
});

socket.on('streamer-disconnected', () => {
    alert('Der Streamer hat die Verbindung getrennt.');
    leaveStream();
});

function updateStatus(text, isConnected) {
    document.getElementById('statusText').textContent = text;
    const statusDot = document.querySelector('.status-dot');
    statusDot.className = isConnected ? 'status-dot connected' : 'status-dot';
}

// Enter-Taste für Raum-ID
roomIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinStream();
    }
});

// Vollbild-Änderungen verfolgen
document.addEventListener('fullscreenchange', () => {
    const fullscreenBtn = document.querySelector('.viewer-controls .btn:first-child');
    if (document.fullscreenElement) {
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> Vollbild beenden';
    } else {
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Vollbild';
    }
});
