// Şu an çalan sesi takip etmek için global değişken
let currentAudio = null;
let currentPlayBtn = null;

// Enter tuşu ile arama yapma
document.getElementById('songInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getRecommendations();
    }
});

async function getRecommendations() {
    const songInput = document.getElementById('songInput').value.trim();
    if (!songInput) return;

    // UI Elementleri
    const loading = document.getElementById('loading');
    const resultsSection = document.getElementById('results-section');
    const errorMsg = document.getElementById('error-message');
    const searchBtn = document.getElementById('searchBtn');

    // Arama başlatıldığında UI'ı güncelle
    loading.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    errorMsg.classList.add('hidden');
    searchBtn.disabled = true;
    searchBtn.style.opacity = '0.7';

    // Daha önceki ses çalıyorsa durdur
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    try {
        const response = await fetch('/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ song_name: songInput })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Bilinmeyen bir hata oluştu.');
        }

        displayResults(data);

    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
        searchBtn.disabled = false;
        searchBtn.style.opacity = '1';
    }
}

function displayResults(data) {
    // Aranan (Seed) Şarkıyı Göster
    const seedContainer = document.getElementById('seed-song-display');
    seedContainer.innerHTML = `
        <img src="${data.seed_song.album_art}" alt="Album Art">
        <div class="song-details">
            <h4>${data.seed_song.name}</h4>
            <p>${data.seed_song.artist}</p>
        </div>
    `;

    // Önerileri Göster
    const grid = document.getElementById('recommendations-grid');
    grid.innerHTML = ''; // Temizle

    data.recommendations.forEach(song => {
        // Ses önizlemesi var mı kontrolü
        const hasPreview = song.preview_url ? true : false;
        const playBtnHtml = hasPreview ? 
            `<div class="play-overlay" onclick="togglePlay('${song.preview_url}', this)">
                <div class="play-btn"><i class="fas fa-play"></i></div>
             </div>` : 
            `<div class="play-overlay" style="background: rgba(0,0,0,0.7); cursor: not-allowed;" title="Ses önizlemesi yok">
                <div class="play-btn" style="background: #555;"><i class="fas fa-ban"></i></div>
             </div>`;

        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="card-img-container">
                <img src="${song.album_art}" alt="${song.name}">
                ${playBtnHtml}
            </div>
            <h4>${song.name}</h4>
            <p>${song.artist}</p>
            <a href="${song.spotify_url}" target="_blank" class="spotify-link">
                <i class="fas fa-headphones"></i> Şarkıya Git
            </a>
        `;
        grid.appendChild(card);
    });

    // Sonuçları göster
    document.getElementById('results-section').classList.remove('hidden');
}

function togglePlay(url, overlayElement) {
    if (!url) return;

    const icon = overlayElement.querySelector('.fa-play, .fa-pause');
    
    // Aynı şarkıya tıklandıysa (Durdur)
    if (currentAudio && currentAudio.src === url) {
        if (!currentAudio.paused) {
            currentAudio.pause();
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
        } else {
            currentAudio.play();
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
        }
        return;
    }

    // Farklı şarkıya tıklandıysa
    if (currentAudio) {
        currentAudio.pause();
        if (currentPlayBtn) {
            currentPlayBtn.classList.remove('fa-pause');
            currentPlayBtn.classList.add('fa-play');
        }
    }

    currentAudio = new Audio(url);
    currentAudio.play();
    currentAudio.volume = 0.5; // Sesi %50 yap
    
    icon.classList.remove('fa-play');
    icon.classList.add('fa-pause');
    currentPlayBtn = icon;

    // Şarkı bitince ikonu geri çevir
    currentAudio.onended = function() {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        currentAudio = null;
    };
}
