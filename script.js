// API Keys (sostituisci con le tue)
const TMDB_API_KEY = '9cb22d145717950bd470bb81f182910c'; // TMDB key
const GEMINI_API_KEY = 'AIzaSyBegxpW00dXUw4wfjeZCXDhw_mbtkp_thg'; // La tua chiave da Google AI Studio (es. AIzaSy...)

// Seleziona elementi DOM
const genreFilter = document.getElementById('genreFilter');
const moviesGrid = document.getElementById('moviesGrid');
const chatInput = document.getElementById('chatInput');
const sendMessage = document.getElementById('sendMessage');
const chatOutput = document.getElementById('chatOutput');
const loading = document.getElementById('loading');
let genres = []; // Array per generi
let movies = []; // Array per film

// Funzione per caricare generi
async function loadGenres() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=it-IT`);
        if (!response.ok) {
            throw new Error(`Errore TMDB Generi: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        genres = data.genres;
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Errore nel caricamento generi:', error);
    }
}

// Funzione per caricare film popolari
async function loadMovies() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=it-IT&page=1`);
        if (!response.ok) {
            throw new Error(`Errore TMDB Film: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        movies = data.results;
        displayMovies();
    } catch (error) {
        console.error('Errore nel caricamento film:', error);
    }
}

// Funzione per visualizzare film (con filtro)
function displayMovies() {
    moviesGrid.innerHTML = '';
    const selectedGenreId = genreFilter.value;
    const filteredMovies = selectedGenreId ? movies.filter(movie => movie.genre_ids.includes(parseInt(selectedGenreId))) : movies;
    filteredMovies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-rating">Voto: ${movie.vote_average}/10</p>
            </div>
        `;
        moviesGrid.appendChild(card);
    });
}

// Event listener per filtro genere
genreFilter.addEventListener('change', displayMovies);

// Funzione per inviare messaggio al chatbot (Gemini con caricamento)
async function sendMessageToChat() {
    const message = chatInput.value.trim();
    if (message === '') return;

    // Aggiungi messaggio utente
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user-message';
    userMsg.textContent = message;
    chatOutput.appendChild(userMsg);
    chatInput.value = '';

    // Mostra caricamento
    loading.classList.add('active');

    // Scrolla in basso
    chatOutput.scrollTop = chatOutput.scrollHeight;

    try {
        console.log('Invio richiesta a Gemini con messaggio:', message);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.7,
                },
            }),
        });

        console.log('Status risposta:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Errore Gemini: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Dati JSON:', data);
        const aiReply = data.candidates[0].content.parts[0].text;

        // Aggiungi risposta AI
        const aiMsg = document.createElement('div');
        aiMsg.className = 'chat-message ai-message';
        aiMsg.textContent = aiReply;
        chatOutput.appendChild(aiMsg);
    } catch (error) {
        console.error('Errore Gemini:', error);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'chat-message ai-message';
        errorMsg.textContent = 'Errore: Non riesco a rispondere. Controlla la chiave API.';
        chatOutput.appendChild(errorMsg);
    } finally {
        // Nascondi caricamento
        loading.classList.remove('active');
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }
}

// Event listener per chatbot
sendMessage.addEventListener('click', sendMessageToChat);
chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessageToChat();
    }
});

// Carica dati all'avvio
window.addEventListener('load', () => {
    loadGenres();
    loadMovies();
});