var Promise     = require("es6-promise").Promise,
    gulp        = require("gulp");


/**
 * Converts a variable number of readable streams into a promise.
 * @param {...Readable} var_args - Readable streams that will be merged
 * @returns {Promise} A promise that will be resolved with undefined when all
 * of the streams have ended.  If any of the streams emit an "error" event, the
 * error will be logged on the console and the promise will be rejected with
 * that error.
 */
function streamsToPromise(var_args) { //eslint-disable-line no-unused-vars
    var mergeStream = require("merge-stream"),
        consume     = require("stream-consume"),
        streams     = Array.prototype.slice.call(arguments);

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

        // Workaround for issue where readable streams are not processed
        // unless there is a consumer.
        consume(merged);
    });
}


/**
 * Transpiles TypeScript source files.
 * @param {string[]} srcGlobs - TypeScript files to be compiled
 * @param {string} jsOutputDir - Where to write the output JS files
 * @param {string} typingsOutputDir - Where to write the output .d.ts files
 * @returns {Promise} A promise that is resolved with undefined when
 * compilation is complete.  If an error occurs, the promise will be
 * rejected with the error.
 */
function buildTypeScript(srcGlobs, jsOutputDir, typingsOutputDir) {
    "use strict";

    var ts                   = require("gulp-typescript"),
        sourcemaps           = require("gulp-sourcemaps"),
        emitDeclarationFiles = !!typingsOutputDir,
        tsResults,
        streams              = [];

    tsResults = gulp
        .src(srcGlobs /*, {base: 'src'}*/)
        .pipe(sourcemaps.init())
        .pipe(ts(
            {
                target:            "ES5",
                declarationFiles:  emitDeclarationFiles,
                noExternalResolve: false,
                noEmitOnError:     true,
                module:            "commonjs"
            },
            undefined,
            ts.reporter.longReporter())
        );

    // Add the js stream.
    streams.push(tsResults.js
                     .pipe(sourcemaps.write())
                     .pipe(gulp.dest(jsOutputDir)));

    // If creating declaration files, prepare that stream.
    if (emitDeclarationFiles) {
        streams.push(tsResults.dts
                         .pipe(gulp.dest(typingsOutputDir)));
    }

    return streamsToPromise.apply(null, streams);
}


/**
 * Just like Node's child_process.exec(), but returns a promise.
 * @param {string} command - The command to execute
 * @param {object} options - See child_process.exec()
 * @returns {Promise} A promise that is resolved with stdout when
 * successful.  If an error occurs, the promise is rejected with an object
 * containing "error", "stdout" and "stderr" properties.
 */
function exec(command, options) {
    "use strict";

    return new Promise(function (resolve, reject) {
        var nodeExec = require("child_process").exec;

        nodeExec(
            command,
            options,
            function (err, stdout, stderr) {
                if (err) {
                    reject({error:  err,
                            stdout: stdout,
                            stderr: stderr});
                    return;
                }

                resolve(stdout);
            }
        );
    });
}


module.exports = {
    streamsToPromise: streamsToPromise,
    buildTypeScript:  buildTypeScript,
    exec:             exec
};
