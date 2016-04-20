const ConcatSource = require("webpack-sources").ConcatSource;
const toCamelCase = require('varname').camelcase;

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

	options.systemjsDeps.forEach(systemJsDep => {
		if (compiler.options.externals[systemJsDep]) {
			throw new Error(`SystemJS dependency '${systemJsDep}' cannot also be a webpack external (webpack-system-register plugin)`);
		}
		compiler.options.externals[systemJsDep] = toJsVarName(systemJsDep);
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
			chunks.forEach(chunk => {
				if (!chunk.initial) {
					return;
				}

				chunk.files.forEach(file => {
					compilation.assets[file] = new ConcatSource(sysRegisterStart(options), compilation.assets[file], sysRegisterEnd(options));
				});
			});
			callback();
		});
	});
};

function sysRegisterStart(opts) {
	const result =
`System.register(${registerName()}${depsList()}, function($__export) {
  var ${opts.systemjsDeps.map(toJsVarName).map(toCommaSeparatedList).reduce(toString)};

  function $__register__main__exports(exports) {
    for (var exportName in exports) {
	  $__export(exportName, exports[exportName]);
    }
  }

  return {
    setters: [${opts.systemjsDeps.map(toSetters).reduce(toString)}
    ],
    execute: function() {
`
	return result;

	function registerName() {
		return opts.registerName ? `'${opts.registerName}', ` : '';
	}

	function depsList() {
		return `[${opts.systemjsDeps.map(toStringLiteral).map(toCommaSeparatedList).reduce(toString)}]`;
	}

	function toCommaSeparatedList(name, i) {
		return `${i > 0 ? ', ' : ''}${name}`;
	}

	function toSetters(name, i) {
		return `${i > 0 ? ',' : ''}
      function(m) {
        ${toJsVarName(name)} = m;
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
	return toCamelCase(moduleName(systemJsImportName));
}

function moduleName(systemJsImportName) {
	return systemJsImportName.includes('!') ? systemJsImportName.slice(0, systemJsImportName.indexOf('!')) : systemJsImportName;
}
