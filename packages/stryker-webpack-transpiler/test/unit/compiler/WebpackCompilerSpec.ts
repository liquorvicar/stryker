import { expect } from 'chai';
import { createFakeWebpackConfig, createTextFile, createWebpackMock, Mock, createMockInstance, createStats, createChunk } from '../../helpers/producers';
import { WebpackCompilerMock } from '../../helpers/mockInterfaces';
import InputFileSystem from '../../../src/fs/InputFileSystem';
import OutputFileSystem from '../../../src/fs/OutputFileSystem';
import WebpackCompiler from '../../../src/compiler/WebpackCompiler';
import { TextFile } from 'stryker-api/core';
import * as path from 'path';
import * as webpack from '../../../src/compiler/Webpack';
import { Configuration } from 'webpack';
import ChunkSorter, * as chunkSorterModule from '../../../src/compiler/ChunkSorter';
import { Chunk } from '../../../src/compiler/ChunkSorter';

describe('WebpackCompiler', () => {
  let sut: WebpackCompiler;
  let inputFileSystemMock: Mock<InputFileSystem>;
  let outputFileSystemMock: Mock<OutputFileSystem>;
  let webpackCompilerMock: WebpackCompilerMock;
  let chunkSorterMock: Mock<ChunkSorter>;

  let fakeWebpackConfig: Configuration;

  beforeEach(() => {
    inputFileSystemMock = createMockInstance(InputFileSystem);
    outputFileSystemMock = createMockInstance(OutputFileSystem);
    chunkSorterMock = createMockInstance(ChunkSorter);
    webpackCompilerMock = createWebpackMock();
    fakeWebpackConfig = createFakeWebpackConfig();

    sandbox.stub(chunkSorterModule, 'default').returns(chunkSorterMock);
    sandbox.stub(webpack, 'default').returns(webpackCompilerMock);
  });

  describe('writeFilesToFs', () => {

    beforeEach(() => {
      sut = new WebpackCompiler(fakeWebpackConfig, inputFileSystemMock as any, outputFileSystemMock as any);
    });

    it('should call the mkdirp function on the inputFS with the basedir of the given file', () => {
      const textFiles = createFakeTextFileArray();
      sut.writeFilesToFs(textFiles);

      textFiles.forEach((textFile, index) => {
        expect(inputFileSystemMock.mkdirpSync).calledWith(path.dirname(textFile.name));
      });
    });

    it('should call the writeFile function on the inputFS with the given file', () => {
      const textFiles = createFakeTextFileArray();
      sut.writeFilesToFs(textFiles);

      textFiles.forEach((textFile, index) => {
        expect(inputFileSystemMock.writeFileSync).calledWith(textFile.name);
      });
    });
  });

  describe('emit', () => {
    let webpackRunStub: sinon.SinonStub;
    let chunks: Chunk[];

    beforeEach(() => {
      chunks = [createChunk(), createChunk()];
      sut = new WebpackCompiler(fakeWebpackConfig, inputFileSystemMock as any, outputFileSystemMock as any);
      webpackRunStub = sandbox.stub(webpackCompilerMock, 'run').callsArgWith(0, null, createStats(chunks));
    });

    it('should call the run function on the webpack compiler', async () => {
      outputFileSystemMock.collectFiles.returns([]);
      await sut.emit();
      expect(webpackRunStub).calledOnce;
    });

    it('should collect files from the outputFS', async () => {
      const expectedFiles = [{ name: 'foobar' }];
      outputFileSystemMock.collectFiles.returns(expectedFiles);
      const actualResult = await sut.emit();

      expect(actualResult).eq(expectedFiles);
      expect(outputFileSystemMock.collectFiles).calledWith(chunks);
    });

    it('should return an error when the webpack compiler fails to compile', async () => {
      const fakeError: string = 'fakeError';
      webpackRunStub.callsArgWith(0, new Error(fakeError));

      try {
        await sut.emit();

        expect.fail('Function should throw an error!');
      } catch (err) {
        expect(err.name).to.equal('Error');
        expect(err.message).to.equal(fakeError);
      }
    });

    it('should return a string representation of the error when the compiler has errors', async () => {
      const fakeError: string = 'fakeError';
      webpackRunStub.callsArgWith(0, null, {
        hasErrors: () => true,
        toString: () => fakeError
      });

      try {
        await sut.emit();
        expect.fail(null, null, 'Function should throw an error!');
      } catch (err) {
        expect(err.name).to.equal('Error');
        expect(err.message).to.equal(fakeError);
      }
    });
  });

  function createFakeTextFileArray(): Array<TextFile> {
    return [
      createTextFile('path/to/awesome/directory/file1'),
      createTextFile('path/to/awesome/directory/file2'),
      createTextFile('path/to/awesome/directory/file3'),
      createTextFile('path/to/awesome/directory/file4')
    ];
  }
});