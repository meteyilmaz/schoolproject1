// 1. SORU VERİTABANI - JSON'dan yüklenecek (2 şıklı)
let questions = {};
let currentLesson = 'turkce';
let currentQuestionIndex = 0;
let score = 0;
let isAnswered = false;
let totalQuestions = 0;

// 2. DOM ELEMENTLERİ
const questionEl = document.getElementById('question');
const answerButtons = document.querySelectorAll('.answer-btn');
const lessonButtons = document.querySelectorAll('.lesson-btn');
const avatarEl = document.getElementById('main-avatar');
const statusEl = document.getElementById('avatar-status');
const currentScoreEl = document.getElementById('current-score');
const questionCounterEl = document.getElementById('question-counter');
const progressFillEl = document.getElementById('progress-fill');

// 3. JSON DOSYASINDAN SORULARI YÜKLE
async function loadQuestionsFromJSON() {
    try {
        // JSON dosyasını yükle (yerel veya online)
        const response = await fetch('sorular.json');
        
        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }
        
        questions = await response.json();
        console.log('Sorular başarıyla yüklendi:', questions);
        
        // İlk soruyu yükle
        loadQuestion();
        
    } catch (error) {
        console.error('Sorular yüklenirken hata oluştu:', error);
        
        // Hata durumunda varsayılan soruları kullan
        questions = getDefaultQuestions();
        questionEl.innerHTML = `<div class="error">⚠️ Sorular yüklenemedi. Yerel sorular kullanılıyor.</div>`;
        
        setTimeout(() => {
            loadQuestion();
        }, 2000);
    }
}

// 4. Varsayılan sorular (JSON yüklenmezse kullanılacak) - 2 ŞIKLI
function getDefaultQuestions() {
    return {
        matematik: [
            { 
                question: "5 + 7 kaçtır?", 
                options: ["10", "12"], 
                correct: 1 
            },
            { 
                question: "9 - 3 kaçtır?", 
                options: ["4", "6"], 
                correct: 1 
            },
            { 
                question: "4 × 3 kaçtır?", 
                options: ["7", "12"], 
                correct: 1 
            },
            { 
                question: "15 ÷ 5 kaçtır?", 
                options: ["3", "5"], 
                correct: 0 
            },
            { 
                question: "Bir düzine kaç adettir?", 
                options: ["10", "12"], 
                correct: 1 
            },
            { 
                question: "8 + 6 kaçtır?", 
                options: ["13", "14"], 
                correct: 1 
            },
            { 
                question: "20 - 8 kaçtır?", 
                options: ["11", "12"], 
                correct: 1 
            },
            { 
                question: "5 × 4 kaçtır?", 
                options: ["18", "20"], 
                correct: 1 
            },
            { 
                question: "18 ÷ 3 kaçtır?", 
                options: ["5", "6"], 
                correct: 1 
            },
            { 
                question: "Bir saat kaç dakikadır?", 
                options: ["50", "60"], 
                correct: 1 
            }
        ],
        fen: [
            { 
                question: "Güneş sistemimizde kaç gezegen var?", 
                options: ["8", "9"], 
                correct: 0 
            },
            { 
                question: "Hangi hayvan memelidir?", 
                options: ["Köpekbalığı", "Yunus"], 
                correct: 1 
            },
            { 
                question: "Bitkiler ne ile besin üretir?", 
                options: ["Kök", "Yaprak"], 
                correct: 1 
            },
            { 
                question: "Su kaç derecede kaynar?", 
                options: ["75°C", "100°C"], 
                correct: 1 
            },
            { 
                question: "Hangisi bir kuvvet birimidir?", 
                options: ["Newton", "Litre"], 
                correct: 0 
            },
            { 
                question: "Hangi madde sıvıdır?", 
                options: ["Tahta", "Su"], 
                correct: 1 
            },
            { 
                question: "Dünya'nın uydusu nedir?", 
                options: ["Venüs", "Ay"], 
                correct: 1 
            },
            { 
                question: "Hangisi bir elektrik kaynağıdır?", 
                options: ["Pil", "Sandalye"], 
                correct: 0 
            },
            { 
                question: "Hangi organ nefes almamızı sağlar?", 
                options: ["Kalp", "Akciğer"], 
                correct: 1 
            },
            { 
                question: "Hangisi bir ışık kaynağıdır?", 
                options: ["Ayna", "Ampul"], 
                correct: 1 
            }
        ],
        turkce: [
            { 
                question: "Türkiye'nin başkenti neresidir?", 
                options: ["İstanbul", "Ankara"], 
                correct: 1 
            },
            { 
                question: "Hangisi noktalama işareti değildir?", 
                options: ["Nokta", "Harfler"], 
                correct: 1 
            },
            { 
                question: "'Kitap' kelimesinin eş anlamlısı nedir?", 
                options: ["Defter", "Roman"], 
                correct: 1 
            },
            { 
                question: "Hangi kelime büyük harfle başlamaz?", 
                options: ["ankara", "İstanbul"], 
                correct: 0 
            },
            { 
                question: "'Koşmak' fiilinin şimdiki zamanı nedir?", 
                options: ["Koşuyor", "Koştu"], 
                correct: 0 
            },
            { 
                question: "Hangisi birleşik kelimedir?", 
                options: ["Ev", "Hanımeli"], 
                correct: 1 
            },
            { 
                question: "Alfabemizde kaç harf vardır?", 
                options: ["28", "29"], 
                correct: 1 
            },
            { 
                question: "Hangisi bir yazım yanlışıdır?", 
                options: ["Telefon", "Telafuz"], 
                correct: 1 
            },
            { 
                question: "Hangi cümle olumludur?", 
                options: ["Gitmeyecek.", "Okuyor."], 
                correct: 1 
            },
            { 
                question: "'Yavru' kelimesinin zıt anlamlısı nedir?", 
                options: ["Yetişkin", "Anne"], 
                correct: 0 
            }
        ]
    };
}

// 5. SAYFA YÜKLENDİĞİNDE
document.addEventListener('DOMContentLoaded', function() {
    // JSON'dan soruları yükle
    loadQuestionsFromJSON();
    
    // Ders butonlarına tıklama olayı ekle
    lessonButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (isAnswered || Object.keys(questions).length === 0) return;
            changeLesson(this.dataset.lesson);
        });
    });
    
    // Cevap butonlarına tıklama olayı ekle
    answerButtons.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            if (isAnswered || Object.keys(questions).length === 0) return;
            checkAnswer(index);
        });
    });
});

// 6. DERS DEĞİŞTİRME FONKSİYONU
function changeLesson(lesson) {
    currentLesson = lesson;
    currentQuestionIndex = 0;
    score = 0;
    isAnswered = false;
    
    // Toplam soru sayısını güncelle
    const currentQuestions = questions[currentLesson] || [];
    totalQuestions = currentQuestions.length;
    
    // Ders butonlarının aktif durumunu güncelle
    lessonButtons.forEach(btn => {
        if (btn.dataset.lesson === lesson) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // İlerleme göstergesini güncelle
    updateProgress();
    
    // Avatar durumunu güncelle
    updateAvatar('default');
    
    // Yeni dersin ilk sorusunu yükle
    loadQuestion();
}

// 7. SORU YÜKLEME FONKSİYONU
function loadQuestion() {
    const currentQuestions = questions[currentLesson];
    
    if (!currentQuestions || currentQuestions.length === 0) {
        questionEl.innerHTML = `<div class="error">❌ Bu ders için soru bulunamadı.</div>`;
        return;
    }
    
    if (currentQuestionIndex >= currentQuestions.length) {
        showResults();
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    questionEl.textContent = question.question;
    
    // Cevap butonlarını güncelle (sadece 2 buton kullan)
    answerButtons.forEach((btn, index) => {
        if (index < question.options.length) {
            btn.querySelector('.text').textContent = question.options[index];
            btn.style.display = 'flex';
            btn.classList.remove('correct', 'wrong');
        } else {
            btn.style.display = 'none';
        }
    });
    
    isAnswered = false;
    updateAvatar('thinking');
}

// 8. CEVAP KONTROL FONKSİYONU
function checkAnswer(selectedIndex) {
    if (isAnswered) return;
    
    isAnswered = true;
    const currentQuestions = questions[currentLesson];
    const question = currentQuestions[currentQuestionIndex];
    const selectedBtn = answerButtons[selectedIndex];
    const correctIndex = question.correct;
    
    // Tüm butonları etkisiz hale getir
    answerButtons.forEach(btn => {
        btn.style.pointerEvents = 'none';
    });
    
    if (selectedIndex === correctIndex) {
        // DOĞRU CEVAP
        selectedBtn.classList.add('correct');
        score += 10;
        updateAvatar('happy');
        playSound('correct');
    } else {
        // YANLIŞ CEVAP
        selectedBtn.classList.add('wrong');
        answerButtons[correctIndex].classList.add('correct');
        updateAvatar('sad');
        playSound('wrong');
    }
    
    // İlerleme göstergesini güncelle
    updateProgress();
    
    // 1.5 saniye sonra bir sonraki soruya geç
    setTimeout(() => {
        currentQuestionIndex++;
        resetAnswerButtons();
        loadQuestion();
    }, 1500);
}

// 9. CEVAP BUTONLARINI SIFIRLA
function resetAnswerButtons() {
    answerButtons.forEach(btn => {
        btn.classList.remove('correct', 'wrong');
        btn.style.pointerEvents = 'auto';
        btn.style.display = 'flex';
    });
}

// 10. İLERLEME GÖSTERGESİNİ GÜNCELLE
function updateProgress() {
    if (!currentScoreEl || !questionCounterEl || !progressFillEl) return;
    
    const currentQuestions = questions[currentLesson] || [];
    const total = currentQuestions.length;
    
    // Puanı güncelle
    currentScoreEl.textContent = score;
    
    // Soru sayacını güncelle
    questionCounterEl.textContent = `${Math.min(currentQuestionIndex + 1, total)}/${total}`;
    
    // İlerleme çubuğunu güncelle
    const progress = total > 0 ? ((currentQuestionIndex + 1) / total) * 100 : 0;
    progressFillEl.style.width = `${progress}%`;
}

// 11. AVATAR GÜNCELLEME
function updateAvatar(mood) {
    if (!avatarEl || !statusEl) return;
    
    // Önceki durum class'larını temizle
    avatarEl.classList.remove('happy', 'sad', 'thinking', 'default');
    
    // Yeni durumu ekle
    avatarEl.classList.add(mood);
    
    // Durum metnini güncelle
    const statusTexts = {
        'happy': {
            icon: 'bi-emoji-smile',
            text: 'Harika! Çok iyi gidiyorsun!'
        },
        'sad': {
            icon: 'bi-emoji-frown',
            text: 'Üzülme, bir sonrakinde başaracaksın!'
        },
        'thinking': {
            icon: 'bi-lightbulb',
            text: 'Hmm, bunu düşünelim...'
        },
        'default': {
            icon: 'bi-emoji-wink',
            text: 'Merhaba! Hadi biraz öğrenelim!'
        }
    };
    
    const status = statusTexts[mood] || statusTexts.default;
    
    statusEl.innerHTML = `
        <i class="bi ${status.icon}"></i>
        <span>${status.text}</span>
    `;
}

// 12. SES EFEKTLERİ
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'correct') {
            // Doğru cevap için neşeli ses
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // Do
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // Mi
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // Sol
        } else {
            // Yanlış cevap için düşük ses
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // Düşük A
            oscillator.frequency.setValueAtTime(196, audioContext.currentTime + 0.1); // Sol
        }
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        // Tarayıcı ses desteği yoksa sessiz kal
        console.log("Ses efekti desteklenmiyor");
    }
}

// 13. SONUÇLARI GÖSTER
function showResults() {
    const currentQuestions = questions[currentLesson] || [];
    const total = currentQuestions.length;
    const percentage = total > 0 ? Math.round((score / (total * 10)) * 100) : 0;
    
    // Yıldız hesaplama
    let stars = '';
    if (percentage >= 90) stars = '⭐⭐⭐⭐⭐';
    else if (percentage >= 70) stars = '⭐⭐⭐⭐';
    else if (percentage >= 50) stars = '⭐⭐⭐';
    else if (percentage >= 30) stars = '⭐⭐';
    else stars = '⭐';
    
    questionEl.innerHTML = `
        <div class="results">
            <h2>🎉 TEBRİKLER! 🎉</h2>
            <p><strong>${currentLesson.toUpperCase()}</strong> dersini tamamladın!</p>
            <p>Puanın: <span style="color: var(--c4); font-weight: 800;">${score}</span></p>
            <p>Başarı Oranın: <span style="color: #4CAF50; font-weight: 800;">${percentage}%</span></p>
            <p style="font-size: 40px; margin: 20px 0;">${stars}</p>
            <button id="restartBtn">Tekrar Oyna</button>
        </div>
    `;
    
    // Yanıt butonlarını gizle
    answerButtons.forEach(btn => btn.style.display = 'none');
    
    // Mutlu avatar
    updateAvatar('happy');
    
    // Başarı sesi
    playSound('correct');
    
    // Tekrar oyna butonu için event listener ekle
    setTimeout(() => {
        document.getElementById('restartBtn').addEventListener('click', function() {
            currentQuestionIndex = 0;
            score = 0;
            resetAnswerButtons();
            updateProgress();
            loadQuestion();
        });
    }, 100);
}

// 14. İLK YÜKLEME
changeLesson('turkce');