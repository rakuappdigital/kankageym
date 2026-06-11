class DialogueManager {
    constructor() {
        this.dialogueBox = document.getElementById('dialogue-box');
        this.dialogueText = document.getElementById('dialogue-text');
        this.continueIndicator = document.getElementById('continue-indicator');
        
        this.lines = [];
        this.currentLineIndex = 0;
        this.isTyping = false;
        this.typingSpeed = 50; // milisaniye
        this.onDialogueComplete = null;
    }

    startDialogue(lines, callback) {
        this.lines = lines;
        this.currentLineIndex = 0;
        this.onDialogueComplete = callback;
        this.dialogueBox.classList.remove('hidden');
        this.showNextLine();
    }

    showNextLine() {
        if (this.currentLineIndex < this.lines.length) {
            this.typeWriter(this.lines[this.currentLineIndex]);
            this.currentLineIndex++;
        } else {
            this.endDialogue();
        }
    }

    typeWriter(text) {
        this.isTyping = true;
        this.dialogueText.innerHTML = '';
        this.continueIndicator.classList.add('hidden');
        
        let charIndex = 0;
        const interval = setInterval(() => {
            this.dialogueText.innerHTML += text.charAt(charIndex);
            charIndex++;
            if (charIndex >= text.length) {
                clearInterval(interval);
                this.isTyping = false;
                this.continueIndicator.classList.remove('hidden');
            }
        }, this.typingSpeed);
    }

    endDialogue() {
        this.dialogueBox.classList.add('hidden');
        if (this.onDialogueComplete) this.onDialogueComplete();
    }
}

const dialogue = new DialogueManager();

// Tıklama veya Boşluk tuşu ile diyalog ilerletme
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !dialogue.isTyping && !dialogue.dialogueBox.classList.contains('hidden')) {
        dialogue.showNextLine();
    }
});
document.getElementById('dialogue-box').addEventListener('click', () => {
    if (!dialogue.isTyping) dialogue.showNextLine();
});
