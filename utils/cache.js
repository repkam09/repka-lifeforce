const Redis = require("ioredis");
const redis = new Redis();

let cacheReady = false;

redis.on("ready", () => {
    cacheReady = true;
});

redis.on("close", () => {
    cacheReady = false;
});

function writeCache(key, status, response, content, ttl = 10) {
    if (!cacheReady) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const data = JSON.stringify({
            status: status,
            response: response,
            content: content
        });

        redis.setex(key, ttl, data).then(() => {
            return resolve();
        }).catch((err) => {
            console.error("Error updating cache for ", key, err.message);
            return resolve()
        })
    })
}

function deleteCacheKeysByPrefix(prefix) {
    if (!cacheReady) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        redis.keys(prefix).then((keys) => {
            const pipeline = redis.pipeline();
            console.log("Found", keys.length, "keys to clean up");

            keys.forEach((key) => {
                pipeline.del(key);
            });

            pipeline.exec().then(() => {
                return resolve();
            }).catch((err) => {
                console.err("Error bulk removing keys", err.message);
                return resolve();
            })
        }).catch((err) => {
            console.err("Error bulk fetching keys", err.message);
            return resolve();
        })
    });
}


function deleteCacheKey(key) {
    if (!cacheReady) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        redis.del(key).then(() => {
            return resolve()
        }).catch((err) => {
            console.err("Error remove cache for ", key, err.message);
            return resolve();
        })
    });
}

function readCache(key) {
    if (!cacheReady) {
        return Promise.resolve({ hasCache: false });
    }

    return new Promise((resolve) => {
        redis.get(key).then((result) => {
            if (!result) {
                return resolve({ hasCache: false });
            }

            try {
                const json = JSON.parse(result);
                return resolve({ hasCache: true, status: json.status, response: json.response });
            } catch (err) {
                console.err("Error parsing response for ", key, err.message);
                return resolve({ hasCache: false })
            }
        }).catch((err) => {
            console.err("Error fetching cache for ", key, err.message);
            return resolve({ hasCache: false })
        })
    })
}



module.exports = {
    readCache,
    writeCache,
    deleteCacheKey,
    deleteCacheKeysByPrefix
}