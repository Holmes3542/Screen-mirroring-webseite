const socket = io();
let stream;
let peerConnections = new Map();
let roomId = generateRoomId();

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('roomId').textContent = roomId;
    socket.emit('join-as-streamer', roomId);
});

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function copyRoomId() {
    navigator.clipboard.writeText(roomId).then(() => {
        alert('Raum-ID kopiert!');
    });
}

async function startStreaming() {
    try {
        // Bildschirm und Audio abfragen
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            },
            audio: true
        });

        const previewVideo = document.getElementById('previewVideo');
        previewVideo.srcObject = stream;
        document.getElementById('noPreview').style.display = 'none';
        
        updateStatus('Stream läuft', true);
        document.getElementById('startStreamBtn').disabled = true;
        document.getElementById('stopStreamBtn').disabled = false;
        document.getElementById('toggleAudioBtn').innerHTML = '<i class="fas fa-microphone-slash"></i> Ton stumm';

        // Überwache Stream-Ende (z.B. wenn Benutzer "Teilen beenden" drückt)
        stream.getVideoTracks()[0].onended = () => {
            stopStreaming();
        };

    } catch (err) {
        console.error('Fehler beim Starten des Streams:', err);
        alert('Fehler beim Starten des Streams: ' + err.message);
    }
}

function stopStreaming() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        
        const previewVideo = document.getElementById('previewVideo');
        previewVideo.srcObject = null;
        document.getElementById('noPreview').style.display = 'flex';
        
        updateStatus('Bereit zum Starten', false);
        document.getElementById('startStreamBtn').disabled = false;
        document.getElementById('stopStreamBtn').disabled = true;
        document.getElementById('toggleAudioBtn').innerHTML = '<i class="fas fa-microphone"></i> Ton aktiv';
        
        // Alle Peer-Verbindungen schließen
        peerConnections.forEach(pc => pc.close());
        peerConnections.clear();
    }
}

function toggleAudio() {
    if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            const btn = document.getElementById('toggleAudioBtn');
            btn.innerHTML = audioTrack.enabled ? 
                '<i class="fas fa-microphone-slash"></i> Ton stumm' : 
                '<i class="fas fa-microphone"></i> Ton aktiv';
        }
    }
}

function toggleFullscreen() {
    const container = document.querySelector('.preview-container');
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.error('Vollbild-Fehler:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Socket.io Event Handler
socket.on('viewer-joined', (viewerId) => {
    console.log('Viewer joined:', viewerId);
    updateViewerCount();
    createPeerConnection(viewerId);
});

socket.on('offer', async (data) => {
    const pc = peerConnections.get(data.sender);
    if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', {
            target: data.sender,
            sdp: answer
        });
    }
});

socket.on('answer', async (data) => {
    const pc = peerConnections.get(data.sender);
    if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    }
});

socket.on('ice-candidate', async (data) => {
    const pc = peerConnections.get(data.sender);
    if (pc) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
            console.error('Fehler beim Hinzufügen des ICE-Kandidaten:', err);
        }
    }
});

socket.on('streamer-disconnected', () => {
    updateStatus('Streamer getrennt', false);
    document.getElementById('noStreamMessage').textContent = 'Streamer hat die Verbindung getrennt';
});

function createPeerConnection(viewerId) {
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    });

    // Stream-Tracks hinzufügen
    if (stream) {
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });
    }

    // ICE-Kandidaten senden
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                target: viewerId,
                candidate: event.candidate
            });
        }
    };

    // Verbindungsstatus
    pc.onconnectionstatechange = () => {
        console.log(`Verbindungsstatus mit ${viewerId}: ${pc.connectionState}`);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            pc.close();
            peerConnections.delete(viewerId);
            updateViewerCount();
        }
    };

    peerConnections.set(viewerId, pc);

    // Offer erstellen und senden
    pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
            socket.emit('offer', {
                target: viewerId,
                sdp: pc.localDescription
            });
        })
        .catch(console.error);
}

function updateViewerCount() {
    document.getElementById('viewerCount').textContent = peerConnections.size;
}

function updateStatus(text, isConnected) {
    document.getElementById('statusText').textContent = text;
    const statusDot = document.querySelector('.status-dot');
    statusDot.className = isConnected ? 'status-dot connected' : 'status-dot';
}

// Vollbild-Änderungen verfolgen
document.addEventListener('fullscreenchange', () => {
    const fullscreenBtn = document.getElementById('toggleFullscreenBtn');
    if (document.fullscreenElement) {
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> Vollbild beenden';
    } else {
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Vollbild';
    }
});
