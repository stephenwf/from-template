import {
  chopName, displayTotal, findLocalPlugins, findNpmPlugins, getFromTemplateFile, getInputDirectory, getPackageJson,
  parseConfigurationValue,
  resolveModuleQuiet,
} from '../index';
import * as path from 'path';
import Ask from '../ask';

async function runInDirectory(dir, fn) {
  const prevCwd = process.cwd();
  process.chdir(path.resolve(dir));
  await fn();
  process.chdir(prevCwd);
}

describe('from-template', () => {
  describe('displayTotal', () => {
    it('should display total if provided with numbers', () => {
      expect(displayTotal(1, 2)).toEqual(' (1 of 2)');
    });

    it('should not display anything it not numbers', () => {
      expect(displayTotal(1, null)).toEqual('');
      expect(displayTotal(null, 2)).toEqual('');
      expect(displayTotal(null, null)).toEqual('');
    });
  });

  describe('chopName', () => {
    it('should remove from-template from the beginning of a string', () => {
      expect(chopName('from-template-testing-123')).toEqual('testing-123');
      expect(chopName('from-template-from-template')).toEqual('from-template');
    });
    it('should not remove from-template from the middle of a string', () => {
      expect(chopName('testing-from-template')).toEqual('testing-from-template');
      expect(chopName('t-from-template-from-template')).toEqual('t-from-template-from-template');
    });
  });

  describe('findLocalPlugins', () => {
    it('should find a local plugin from .templates directory', async (done) => {
      await runInDirectory(path.join(__dirname, 'fixtures', 'fixture-00'), async () => {
        const localPlugins = await findLocalPlugins();
        expect(localPlugins).toEqual([{value: 'test.txt', name: 'test.txt'}]);
      });
      done();
    });

    it('should find local plugin from .templates directory with multiple files', async (done) => {
      await runInDirectory(path.join(__dirname, 'fixtures', 'fixture-01'), async () => {
        const localPlugins = await findLocalPlugins();
        expect(localPlugins).toEqual([
          {value: 'test.txt', name: 'test.txt'},
          {value: 'test2.txt', name: 'test2.txt'},
        ]);
      });
      done();
    });
  });

  describe('resolveModuleQuiet', () => {
    it('should resolve js path that exists', () => {
      const resolved = resolveModuleQuiet('from-template/src/__tests__/fixtures/fixture-02');
      expect(resolved).not.toEqual(null);
      expect(resolved).toEqual(
          expect.stringMatching(/.*\/__tests__\/fixtures\/fixture-02\/from-template.js$/),
      );
    });

    it('should resolve json path that exists', () => {
      const resolved = resolveModuleQuiet('from-template/src/__tests__/fixtures/fixture-03');
      expect(resolved).not.toEqual(null);
      expect(resolved).toEqual(
          expect.stringMatching(/.*\/__tests__\/fixtures\/fixture-03\/from-template.json$/),
      );
    });

    it('should not throw an error when module not found', () => {
      const resolved = resolveModuleQuiet('not/exist');
      expect(resolved).toEqual(null);
    });
  });

  describe('findNpmPlugins', () => {
    it('should find plugins prefixed with from-template', async () => {
      await runInDirectory(path.join(__dirname, 'fixtures', 'fixture-04'), async () => {
        const npmPlugins = await findNpmPlugins();
        expect(npmPlugins).toEqual([
          {'name': 'testing-1', 'value': 'from-template-testing-1'},
        ]);
      });
    });
  });

  describe('getInputDirectory', () => {
    it('should local templates first', async () => {
      await runInDirectory(path.join(__dirname, 'fixtures', 'fixture-05'), async () => {
        const template = getInputDirectory('from-template-testing-1');
        expect(template).toEqual(
            expect.stringMatching(/.*fixture-05\/.templates\/from-template-testing-1$/),
        );
      });
    });

    it('should fallback to node_modules templates', async () => {
      await runInDirectory(path.join(__dirname, 'fixtures', 'fixture-04'), async () => {
        const template = getInputDirectory('from-template-testing-1');
        expect(template).toEqual(
            expect.stringMatching(/.*fixture-04\/node_modules\/from-template-testing-1$/),
        );
      });
    });

    it('should throw when module does not exist', () => {
      expect(() => {
        getInputDirectory('does-not-exist');
      }).toThrow();
    });
  });

  describe('getPackageJson', () => {
    it('should load packageJson if it exists', async () => {
      await runInDirectory(path.join(__dirname, 'fixtures', 'fixture-04'), async () => {
        const packageJson = getPackageJson();

        expect(packageJson).toEqual({'dependencies': {'from-template-testing-1': '1.0.0'}});
      });
    });

    it('should load packageJson if it exists', async () => {
      await runInDirectory(path.join(__dirname, 'fixtures', 'fixture-01'), async () => {
        expect(() => {
          getPackageJson();
        }).toThrow();
      });
    });
  });

  describe('getFromTemplateFile', () => {

    it('should find js config in template folders', async () => {
      const template = await getFromTemplateFile(path.join(__dirname, 'fixtures', 'fixture-02'), 'fixture-02');
      expect(await template()).toEqual({
        name: 'fixture-2',
      });
    });

    it('should find json config in template folders', async () => {
      await runInDirectory(path.join(__dirname, 'fixtures', 'fixture-04'), async () => {
        const template = await getFromTemplateFile(path.join(__dirname, 'fixtures', 'fixture-04', 'node_modules', 'from-template-testing-1'), 'from-template-testing-1');
        expect(await template({})).toEqual({
          name: 'fixture-4',
        });
      });
    });

    it('should throw an error if configuration is not found', async () => {
      let fail = false;
      await getFromTemplateFile(path.join(__dirname, 'fixtures', 'fixture-00'), 'fixture-00').catch(() => {
        fail = true;
      });
      expect(fail).toEqual(true);
    });

  });

  describe('parseConfigurationValue', () => {
    it('should read $input keywords and ask user for input', () => {
      expect.assertions(3);
      parseConfigurationValue('test-$input', {
        $input: {message: 'Question to ask?', defaultValue: 'some-default-value'},
      }, {
        ask: {
          input(name, message, defaultValue) {
            expect(name).toEqual('test-$input');
            expect(message).toEqual('Question to ask?');
            expect(defaultValue).toEqual('some-default-value');
          },
        },
      });
    });

    it('should read $choice keywords and ask user for choice', () => {
      expect.assertions(3);
      parseConfigurationValue('test-$choice', {
        $choice: {
          message: 'Question to ask?',
          defaultValue: 'one',
          choices: ['one', 'two', 'three'],
        },
      }, {
        ask: {
          choice(name, message, choices) {
            expect(name).toEqual('test-$choice');
            expect(message).toEqual('Question to ask?');
            expect(choices).toEqual(['one', 'two', 'three']);
          },
        },
      });
    });

    it('should read $bool keywords and ask user for yes/no', async () => {
      expect.assertions(8);
      const truth = await parseConfigurationValue('test-$bool', {
        $bool: {
          message: 'Question to ask?',
          defaultValue: true,
          $true: 'truthy',
          $false: 'falsy',
        },
      }, {
        ask: {
          bool(name, message, defaultValue) {
            expect(name).toEqual('test-$bool');
            expect(message).toEqual('Question to ask?');
            expect(defaultValue).toEqual(true);
            return Promise.resolve(true);
          },
        },
      });

      expect(truth).toEqual('truthy');

      const notTrue = await parseConfigurationValue('test-$bool', {
        $bool: {
          message: 'Question to ask?',
          defaultValue: false,
          $true: 'truthy',
          $false: 'falsy',
        },
      }, {
        ask: {
          bool(name, message, defaultValue) {
            expect(name).toEqual('test-$bool');
            expect(message).toEqual('Question to ask?');
            expect(defaultValue).toEqual(false);
            return Promise.resolve(false);
          },
        },
      });

      expect(notTrue).toEqual('falsy');
    });

    it('should just return string values', async () => {
      const val = await parseConfigurationValue('test-string', 'expected-value', {});
      expect(val).toEqual('expected-value');
    })

    it('should just return integer values', async () => {
      const val = await parseConfigurationValue('test-integer', 1234, {});
      expect(val).toEqual(1234);
    })

    it('should reject invalid JSON fields', async () => {
      expect(() => {
        parseConfigurationValue('test-array', [], {})
      }).toThrow();

      expect(() => {
        parseConfigurationValue('test-empty-object', {}, {})
      }).toThrow();

      expect(() => {
        parseConfigurationValue('test-number', 3.14, {})
      }).toThrow();

      expect(() => {
        parseConfigurationValue('test-array', Infinity, {})
      }).toThrow();

      expect(() => {
        parseConfigurationValue('test-array', NaN, {})
      }).toThrow();

      expect(() => {
        parseConfigurationValue('test-array', undefined, {})
      }).toThrow();

    })


  });
});