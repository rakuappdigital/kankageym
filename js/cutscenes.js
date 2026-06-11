class CutsceneManager {
    constructor() {
        this.sceneLayer = document.getElementById('scene-layer');
        this.fadeOverlay = document.getElementById('fade-overlay');
    }

    fadeToBlack(callback) {
        this.fadeOverlay.classList.remove('transparent');
        setTimeout(callback, 1000); // 1 saniye CSS transition bekler
    }

    fadeFromBlack(callback) {
        this.fadeOverlay.classList.add('transparent');
        setTimeout(callback, 1000);
    }

    startIntroSequence() {
        // SAHNE 1: Yakın Çekim Uyanma
        this.sceneLayer.style.backgroundImage = "url('assets/img/close_up_eye.png')"; 
        this.sceneLayer.classList.remove('hidden', 'zoom-in');
        
        this.fadeFromBlack(() => {
            dialogue.startDialogue([
                "Başım çatlıyor...",
                "Dün gece ne oldu hiçbir şey hatırlamıyorum.",
                "Şu an tek ihtiyacım olan şey, sert bir kahve."
            ], () => {
                this.playSceneTwo();
            });
        });
    }

    playSceneTwo() {
        this.fadeToBlack(() => {
            // SAHNE 2: Mutfak Geniş Açı
            this.sceneLayer.style.backgroundImage = "url('assets/img/kitchen_wide.png')";
            
            this.fadeFromBlack(() => {
                dialogue.startDialogue([
                    "Kaliteli bir Ethiopian Yirgacheffe...",
                    "Bu aroma hayattaki her sorunu çözer."
                ], () => {
                    // Zoom-in Efekti
                    this.sceneLayer.classList.add('zoom-in');
                    
                    // Zoom animasyonunun bitmesini biraz bekle ve vurucu cümleleri patlat
                    setTimeout(() => {
                        dialogue.startDialogue([
                            "Aslında hayır, çözmez.",
                            "Artık yüzleşme vakti geldi."
                        ], () => {
                            this.endIntroSequence();
                        });
                    }, 1500); // 1.5 sn zoom süresi
                });
            });
        });
    }

    endIntroSequence() {
        this.fadeToBlack(() => {
            this.sceneLayer.classList.add('hidden');
            gameState.setFlag('introCompleted', true);
            // Overworld (Ana Harita) müziğini başlat ve haritaya geç
            audio.playTrack('overworld');
            
            this.fadeFromBlack(() => {
                // Ana oyun döngüsüne ve haritada yürümeye izin ver
                window.initOverworld();
            });
        });
    }
}

const cutscenes = new CutsceneManager();
