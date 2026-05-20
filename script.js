// Global variables
let playlists = [];
let currentTrack = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let playedIndices = [];

// DOM Elements
const playButton = document.querySelector('.fa-play-circle');
const prevButton = document.querySelector('.fa-step-backward');
const nextButton = document.querySelector('.fa-step-forward');
const shuffleButton = document.querySelector('.fa-random');
const repeatButton = document.querySelector('.fa-redo');
const progressBar = document.querySelector('.progress');
const progressFilled = document.querySelector('.progress-filled');
const currentTimeSpan = document.querySelector('.current-time');
const totalTimeSpan = document.querySelector('.total-time');
const volumeButton = document.querySelector('.fa-volume-up');
const volumeBar = document.querySelector('.volume-bar');
const volumeFilled = document.querySelector('.volume-filled');
const songTitle = document.querySelector('.song-info h4');
const artistName = document.querySelector('.song-info p');
const songCover = document.querySelector('.song-info img');
const playlistContainer = document.getElementById('playlistContainer');
const createPlaylistBtn = document.getElementById('createPlaylistBtn');
const createPlaylistModal = document.getElementById('createPlaylistModal');
const createPlaylistForm = document.getElementById('createPlaylistForm');

// Audio player setup
const audio = new Audio();

// Fetch playlists from the server
async function fetchPlaylists() {
    // Try PHP endpoint first; if unavailable, fall back to playlists.json, then localStorage
    try {
        const response = await fetch('playlists.php');
        if (!response.ok) throw new Error('playlists.php not available');
        playlists = await response.json();
    } catch (err) {
        try {
            const resp2 = await fetch('playlists.json');
            playlists = await resp2.json();
        } catch (err2) {
            console.error('Error fetching playlists.json:', err2);
            playlists = [];
        }
    }

    // Merge any locally-created playlists saved in localStorage (fallback when no PHP)
    try {
        const local = JSON.parse(localStorage.getItem('playlists_local') || '[]');
        if (Array.isArray(local) && local.length) playlists = playlists.concat(local);
    } catch (e) {
        console.warn('Could not parse local playlists:', e);
    }

    renderPlaylists();
    if (playlists.length > 0) {
        loadTrack(0);
    }
}

// Render playlists in the UI
function renderPlaylists() {
    playlistContainer.innerHTML = '';
    playlists.forEach((playlist, index) => {
        const item = document.createElement('div');
        item.className = 'item';
        item.dataset.index = index;
        // include like button (will be toggled)
        item.innerHTML = `
            <img src="${playlist.cover}" alt="" onerror="this.src='https://via.placeholder.com/150?text=No+Image';">
            <button class="like-btn" title="Like">
                <i class="fa-regular fa-heart"></i>
            </button>
            <div class="play">
                <span class="fa fa-play"></span>
            </div>
            <h4>${playlist.title}</h4>
            <p>${playlist.artist}</p>
        `;

        // play when clicking the item but not when clicking controls
        item.addEventListener('click', (ev) => {
            if (ev.target.closest('.like-btn')) return; // ignore like clicks
            currentTrack = Number(item.dataset.index);
            loadTrack(currentTrack);
            togglePlay(true);
        });

        // like button
        const likeBtn = item.querySelector('.like-btn');
        const likeIcon = likeBtn.querySelector('i');
        const likedSet = JSON.parse(localStorage.getItem('liked_tracks') || '[]');
        const identifier = playlist.audio || playlist.title;
        if (likedSet.includes(identifier)) {
            likeIcon.classList.remove('fa-regular');
            likeIcon.classList.add('fa-solid');
            item.classList.add('liked');
        }
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(identifier, likeIcon, item);
        });

        playlistContainer.appendChild(item);
    });
}

function toggleLike(identifier, iconEl, itemEl) {
    const key = 'liked_tracks';
    let arr = JSON.parse(localStorage.getItem(key) || '[]');
    if (arr.includes(identifier)) {
        arr = arr.filter(x => x !== identifier);
        iconEl.classList.remove('fa-solid');
        iconEl.classList.add('fa-regular');
        itemEl.classList.remove('liked');
    } else {
        arr.push(identifier);
        iconEl.classList.remove('fa-regular');
        iconEl.classList.add('fa-solid');
        itemEl.classList.add('liked');
    }
    localStorage.setItem(key, JSON.stringify(arr));
}

// Load track
function loadTrack(trackIndex) {
    const track = playlists[trackIndex];
    audio.src = track.audio;
    songTitle.textContent = track.title;
    artistName.textContent = track.artist;
    songCover.src = track.cover;
    audio.load();
}

// --- Helper Functions ---
function getRandomTrackIndex() {
    if (playedIndices.length === playlists.length) playedIndices = [];
    let idx;
    do {
        idx = Math.floor(Math.random() * playlists.length);
    } while (playedIndices.includes(idx) && playedIndices.length < playlists.length);
    playedIndices.push(idx);
    return idx;
}

// --- Update Playlist UI ---
function updatePlaylistUI() {
    const items = document.querySelectorAll('.item');
    items.forEach((item, index) => {
        const playIcon = item.querySelector('.play .fa');
        if (index === currentTrack && isPlaying) {
            playIcon.classList.remove('fa-play');
            playIcon.classList.add('fa-pause');
            item.classList.add('active');
        } else {
            playIcon.classList.remove('fa-pause');
            playIcon.classList.add('fa-play');
            item.classList.remove('active');
        }
    });
}

// --- Play/Pause ---
function togglePlay(forcePlay = false) {
    if (isPlaying && !forcePlay) {
        audio.pause();
        playButton.classList.remove('fa-pause-circle');
        playButton.classList.add('fa-play-circle');
    } else {
        audio.play();
        playButton.classList.remove('fa-play-circle');
        playButton.classList.add('fa-pause-circle');
    }
    isPlaying = !isPlaying || forcePlay;
    updatePlaylistUI();
}

// --- Next/Previous/Shuffle/Repeat ---
function nextTrack() {
    if (isShuffle) {
        currentTrack = getRandomTrackIndex();
    } else {
        currentTrack = (currentTrack + 1) % playlists.length;
    }
    loadTrack(currentTrack);
    if (isPlaying) audio.play();
    updatePlaylistUI();
}

function prevTrack() {
    if (isShuffle) {
        currentTrack = getRandomTrackIndex();
    } else {
        currentTrack = (currentTrack - 1 + playlists.length) % playlists.length;
    }
    loadTrack(currentTrack);
    if (isPlaying) audio.play();
    updatePlaylistUI();
}

// --- Event Listeners ---
playButton.addEventListener('click', () => togglePlay());
prevButton.addEventListener('click', prevTrack);
nextButton.addEventListener('click', nextTrack);

shuffleButton.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleButton.classList.toggle('active', isShuffle);
});

repeatButton.addEventListener('click', () => {
    isRepeat = !isRepeat;
    repeatButton.classList.toggle('active', isRepeat);
});

audio.addEventListener('ended', () => {
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
    } else {
        nextTrack();
    }
});

// --- Progress Bar ---
audio.addEventListener('timeupdate', updateProgress);
progressBar.addEventListener('click', setProgress);

function updateProgress(e) {
    const { duration, currentTime } = audio;
    if (!isNaN(duration)) {
        const progressPercent = (currentTime / duration) * 100;
        progressFilled.style.width = `${progressPercent}%`;
        // Update time displays
        const currentMinutes = Math.floor(currentTime / 60);
        const currentSeconds = Math.floor(currentTime % 60);
        const durationMinutes = Math.floor(duration / 60);
        const durationSeconds = Math.floor(duration % 60);
        currentTimeSpan.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
        totalTimeSpan.textContent = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
    }
}

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    if (!isNaN(duration)) {
        audio.currentTime = (clickX / width) * duration;
    }
}

// --- Volume ---
volumeBar.addEventListener('click', setVolume);
volumeButton.addEventListener('click', toggleMute);

audio.volume = 0.7;
volumeFilled.style.width = '70%';

function setVolume(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const volume = clickX / width;
    audio.volume = volume;
    volumeFilled.style.width = `${volume * 100}%`;
    if (volume === 0) {
        volumeButton.classList.remove('fa-volume-up');
        volumeButton.classList.add('fa-volume-mute');
    } else {
        volumeButton.classList.remove('fa-volume-mute');
        volumeButton.classList.add('fa-volume-up');
    }
}

function toggleMute() {
    if (audio.volume > 0) {
        audio.volume = 0;
        volumeFilled.style.width = '0%';
        volumeButton.classList.remove('fa-volume-up');
        volumeButton.classList.add('fa-volume-mute');
    } else {
        audio.volume = 1;
        volumeFilled.style.width = '100%';
        volumeButton.classList.remove('fa-volume-mute');
        volumeButton.classList.add('fa-volume-up');
    }
}

// --- Create Playlist Modal ---
createPlaylistBtn.addEventListener('click', () => {
    createPlaylistModal.style.display = 'block';
});

function closeModal() {
    createPlaylistModal.style.display = 'none';
}

createPlaylistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(createPlaylistForm);
    const playlistData = {
        title: formData.get('title'),
        artist: formData.get('artist'),
        cover: formData.get('cover'),
        audio: formData.get('audio')
    };

    try {
        const response = await fetch('playlists.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playlistData)
        });

        if (response.ok) {
            await fetchPlaylists();
            closeModal();
            createPlaylistForm.reset();
            return;
        }
        // if POST failed, fall through to local fallback
    } catch (error) {
        // network or server error (likely PHP not installed)
        console.warn('POST to playlists.php failed; saving locally instead.', error);
    }

    // Local fallback: append to in-memory playlists and save to localStorage
    try {
        playlists.push(playlistData);
        const existing = JSON.parse(localStorage.getItem('playlists_local') || '[]');
        existing.push(playlistData);
        localStorage.setItem('playlists_local', JSON.stringify(existing));
        renderPlaylists();
        closeModal();
        createPlaylistForm.reset();
    } catch (e) {
        console.error('Could not save playlist locally:', e);
    }
});

// Initialize the player
fetchPlaylists(); 

// --- UI Actions (sidebar, navbar, search, library, liked) ---
document.addEventListener('DOMContentLoaded', () => {
    // sidebar buttons
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action === 'home') {
                // reload full list
                fetchPlaylists();
                document.getElementById('searchBar').style.display = 'none';
            } else if (action === 'search') {
                document.getElementById('searchBar').style.display = 'block';
                document.getElementById('searchInput').focus();
            } else if (action === 'library') {
                showLibrary();
            } else if (action === 'create') {
                createPlaylistBtn.click();
            } else if (action === 'liked') {
                showLiked();
            }
        });
    });

    // navbar buttons
    const premiumBtn = document.getElementById('premiumBtn');
    const supportBtn = document.getElementById('supportBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');

    if (premiumBtn) premiumBtn.addEventListener('click', () => alert('Premium is not implemented in this demo.'));
    if (supportBtn) supportBtn.addEventListener('click', () => alert('Support: please open an issue or email support@example.com'));
    if (downloadBtn) downloadBtn.addEventListener('click', () => alert('Download is not available in this demo.'));
    if (signupBtn) signupBtn.addEventListener('click', () => document.getElementById('signupModal').style.display = 'block');
    if (loginBtn) loginBtn.addEventListener('click', () => document.getElementById('loginModal').style.display = 'block');

    // search bar handlers
    const searchInput = document.getElementById('searchInput');
    const searchClose = document.getElementById('searchCloseBtn');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.trim().toLowerCase();
            filterDisplayed(q);
        });
    }
    if (searchClose) searchClose.addEventListener('click', () => {
        document.getElementById('searchBar').style.display = 'none';
        document.getElementById('searchInput').value = '';
        filterDisplayed('');
    });

    // simple login/signup handlers (demo only)
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    if (loginForm) loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Logged in (demo)');
        document.getElementById('loginModal').style.display = 'none';
        loginForm.reset();
    });
    if (signupForm) signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Signed up (demo)');
        document.getElementById('signupModal').style.display = 'none';
        signupForm.reset();
    });
});

function filterDisplayed(q) {
    const items = document.querySelectorAll('#playlistContainer .item');
    items.forEach(it => {
        const title = it.querySelector('h4')?.textContent?.toLowerCase() || '';
        const artist = it.querySelector('p')?.textContent?.toLowerCase() || '';
        const visible = !q || title.includes(q) || artist.includes(q);
        it.style.display = visible ? '' : 'none';
    });
}

function showLibrary() {
    // Show only locally-created playlists
    const local = JSON.parse(localStorage.getItem('playlists_local') || '[]');
    if (!local.length) {
        playlistContainer.innerHTML = '<div style="color:#b3b3b3;padding:20px;">Your library is empty. Create a playlist to get started.</div>';
        return;
    }
    playlistContainer.innerHTML = '';
    local.forEach((pl, i) => {
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = `
            <img src="${pl.cover}" alt="" onerror="this.src='https://via.placeholder.com/150?text=No+Image';">
            <button class="like-btn" title="Like"><i class="fa-regular fa-heart"></i></button>
            <div class="play"><span class="fa fa-play"></span></div>
            <h4>${pl.title}</h4>
            <p>${pl.artist}</p>
        `;
        item.addEventListener('click', () => {
            audio.src = pl.audio; audio.play();
            songTitle.textContent = pl.title; songCover.src = pl.cover; artistName.textContent = pl.artist;
        });
        playlistContainer.appendChild(item);
    });
}

function showLiked() {
    const liked = JSON.parse(localStorage.getItem('liked_tracks') || '[]');
    if (!liked.length) {
        playlistContainer.innerHTML = '<div style="color:#b3b3b3;padding:20px;">No liked songs yet.</div>';
        return;
    }
    // filter current playlists by liked identifier
    const filtered = playlists.filter(p => liked.includes(p.audio || p.title));
    playlistContainer.innerHTML = '';
    filtered.forEach((pl, idx) => {
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = `
            <img src="${pl.cover}" alt="" onerror="this.src='https://via.placeholder.com/150?text=No+Image';">
            <button class="like-btn" title="Like"><i class="fa-solid fa-heart"></i></button>
            <div class="play"><span class="fa fa-play"></span></div>
            <h4>${pl.title}</h4>
            <p>${pl.artist}</p>
        `;
        item.addEventListener('click', () => {
            audio.src = pl.audio; audio.play();
            songTitle.textContent = pl.title; songCover.src = pl.cover; artistName.textContent = pl.artist;
        });
        playlistContainer.appendChild(item);
    });
}