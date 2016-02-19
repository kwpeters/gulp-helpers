var Promise     = require("es6-promise").Promise,
    consume     = require("stream-consume"),
    mergeStream = require("merge-stream");


function streamsToPromise() {
    var streams = Array.prototype.slice.call(arguments);

    return new Promise(function (resolve, reject) {

        var merged = mergeStream();

        streams.forEach(function (curStream) {

            merged.add(curStream);

            curStream.once("error", function onError(err) {
                console.log(err);
                reject(err);
            });

        });

        merged.once("end", function onEnd() {
            resolve();
        });

        consume(merged);
    });


}


module.exports = {
    streamsToPromise: streamsToPromise
};
