class StateManager {
    constructor() {
        this.flags = {
            introCompleted: false,
            arguedWithEx: false,       // Deccal Ex bayrağı
            visitedCoffeeShop: false,  // Coffeeland XL Plus bayrağı
            visitedPub: false,         // Maun Sandık Bar
            talkedToBestie: false      // Kanka's Home
        };
        this.currentLocation = "magaram"; 
    }

    setFlag(key, value) {
        this.flags[key] = value;
        console.log(`[State] ${key} bayrağı ${value} olarak güncellendi.`);
    }

    getFlag(key) {
        return this.flags[key];
    }
}

const gameState = new StateManager();
