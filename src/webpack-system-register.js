import path from 'path';
import fs from 'fs';
import { ConcatSource } from 'webpack-sources';
import { camelcase as toCamelCase } from 'varname';
import PrefetchDependency from 'webpack/lib/dependencies/PrefetchDependency';

module.exports = WebpackSystemRegister;

function WebpackSystemRegister(options) {
	if (typeof options !== 'object')
		throw new Error("webpack-system-register takes exactly one argument (pass an options object)");

	if (options.systemjsDeps && !Array.isArray(options.systemjsDeps))
		throw new Error(`webpack-system-register requires that systemjsDeps is an array of strings`);

	this.options = {
		...{
			systemjsDeps: [],
		},
		...options
	};
}

WebpackSystemRegister.prototype.apply = function(compiler) {
	const options = this.options;
	const externalModuleFiles = [];
	const externalModules = [];

	if (!compiler.options.resolve) {
		compiler.options.resolve = {}
	}

	if (!compiler.options.resolve.alias) {
		compiler.options.resolve.alias = {};
	}

	compiler.plugin('normal-module-factory', function(nmf) {
		nmf.plugin('before-resolve', function(result, callback) {
			if (!result) {
				return callback();
			}

			if (options.systemjsDeps.find(dep => dep.test(result.request))) {
				const filename = `__${toJsVarName(result.request)}`;
				if (externalModuleFiles.indexOf(filename) < 0) {
					externalModuleFiles.push(filename)
					fs.writeFile(filename, `module.exports = ${toJsVarName(result.request)};`, err => {
						if (err) {
							console.error(err);
							throw err;
						}

						externalModules.push({
							depFullPath: result.request,
							depVarName: toJsVarName(result.request),
						});
						result.request = path.resolve(process.cwd(), filename);

						callback(null, result);
					});
				} else {
					result.request = path.resolve(process.cwd(), filename);
					callback(null, result);
				}
			} else {
				callback(null, result)
			}
		});

		nmf.plugin('after-resolve', function(result, callback) {
			if (!result) {
				return callback();
			}

			if (options.systemjsDeps.find(dep => dep.test(result.request))) {
				result.resource = path.resolve(process.cwd(), `__${toJsVarName(result.request)}`);
			}

			callback(null, result);
		});
	});

	compiler.plugin("compilation", compilation => {

		// http://stackoverflow.com/questions/35092183/webpack-plugin-how-can-i-modify-and-re-parse-a-module-after-compilation
		compilation.plugin('seal', () => {
			compilation.modules.forEach(module => {
				let isEntry = module.entry;
				const entries = (compiler.options.entry || {});
				for (let entryName in entries) {
					isEntry = module.rawRequest === entries[entryName];
				}
				if (isEntry) {
					module._source._value += `\n$__register__main__exports(exports);`;
				}
			});
		});

		// Based on https://github.com/webpack/webpack/blob/ded70aef28af38d1deb2ac8ce1d4c7550779963f/lib/WebpackSystemRegister.js
		compilation.plugin("optimize-chunk-assets", (chunks, callback) => {
			externalModuleFiles.forEach(file => {
				fs.unlink(file, err => {
					if (err) {
						throw err;
					}
				});
			});

			chunks.forEach(chunk => {
				if (!chunk.initial) {
					return;
				}

				chunk.files.forEach(file => {
					compilation.assets[file] = new ConcatSource(sysRegisterStart(options, externalModules), compilation.assets[file], sysRegisterEnd(options));
				});
			});
			callback();
		});
	});
};

function sysRegisterStart(opts, externalModules) {
	const result =
`System.register(${registerName()}${depsList()}, function($__export) {
  var ${externalModules.map(toDepVarName).map(toCommaSeparatedList).reduce(toString)};

  function $__register__main__exports(exports) {
    for (var exportName in exports) {
	  $__export(exportName, exports[exportName]);
    }
  }

  return {
    setters: [${externalModules.map(toDepVarName).map(toSetters).reduce(toString)}
    ],
    execute: function() {
`
	return result;

	function registerName() {
		return opts.registerName ? `'${opts.registerName}', ` : '';
	}

	function depsList() {
		return `[${externalModules.map(toDepFullPath).map(toStringLiteral).map(toCommaSeparatedList).reduce(toString)}]`;
	}

	function toCommaSeparatedList(name, i) {
		return `${i > 0 ? ', ' : ''}${name}`;
	}

	function toSetters(name, i) {
		return `${i > 0 ? ',' : ''}
      function(m) {
        ${name} = m;
	  }`;
	}

	function toStringLiteral(str) {
		return `'${str}'`;
	}

	function toString(prev, next) {
		return prev + next;
	}
}

function sysRegisterEnd(opts) {
	const result =
`
    }
  }
});
`
	return result;
}

function toJsVarName(systemJsImportName) {
	return toCamelCase(removeSlashes(moduleName(systemJsImportName)));
}

function moduleName(systemJsImportName) {
	return systemJsImportName.includes('!') ? systemJsImportName.slice(0, systemJsImportName.indexOf('!')) : systemJsImportName;
}

function removeSlashes(systemJsImportName) {
	return systemJsImportName.replace('/', '');
}

function toDepVarName(externalModule) {
	return externalModule.depVarName;
}

function toDepFullPath(externalModule) {
	return externalModule.depFullPath;
}
