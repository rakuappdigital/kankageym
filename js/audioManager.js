class AudioManager {
    constructor() {
        this.currentTrack = null;
        this.tracks = {
            overworld: new Audio('assets/audio/map_loop.mp3'),
            exHouse: new Audio('assets/audio/ex_house.mp3'),
            magaram: new Audio('assets/audio/magaram.mp3')
        };
        
        // Loop ayarları
        for(let key in this.tracks) {
            this.tracks[key].loop = true;
        }
    }

    playTrack(trackName) {
        if (!this.tracks[trackName]) return;
        
        if (this.currentTrack) {
            this.currentTrack.pause();
            this.currentTrack.currentTime = 0;
        }
        
        this.currentTrack = this.tracks[trackName];
        this.currentTrack.play().catch(e => console.log("Otomatik oynatma engellendi. Kullanıcı etkileşimi bekleniyor."));
    }
}

const audio = new AudioManager();
