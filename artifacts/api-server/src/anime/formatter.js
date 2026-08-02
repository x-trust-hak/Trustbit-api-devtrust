function formatSearch(results) {

    let text = `🔍 *Anime Search Results*\n\n`;

    results.forEach((anime) => {

        text += `*${anime.id}.* ${anime.title}\n`;
        text += `🎬 ${anime.episode}\n`;
        text += `📌 ${anime.status}\n\n`;

    });

    text += "━━━━━━━━━━━━━━\n";
    text += "Reply with:\n";
    text += "*.anime 1*";

    return text;

}

module.exports = {
    formatSearch
};