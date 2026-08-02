const cache = new Map();

const TTL = 1000 * 60 * 30; // 30 minutes

function key(jid) {
    return jid.split("@")[0];
}

function setUserAnime(jid, data) {
    const userKey = key(jid);

    const old = cache.get(userKey) || {
        results: [],
        anime: null,
        seasons: [],
        selectedSeason: null,
        episodes: [],
        selectedEpisode: null
    };

    cache.set(userKey, {
        ...old,
        ...data,
        createdAt: Date.now()
    });
}

function getUserAnime(jid) {
    const userKey = key(jid);

    const user = cache.get(userKey);

    if (!user) return null;

    if (Date.now() - user.createdAt > TTL) {
        cache.delete(userKey);
        return null;
    }

    return user;
}

function clearUserAnime(jid) {
    cache.delete(key(jid));
}

module.exports = {
    setUserAnime,
    getUserAnime,
    clearUserAnime
};