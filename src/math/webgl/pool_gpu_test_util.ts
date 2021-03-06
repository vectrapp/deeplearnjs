/* Copyright 2017 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {Array3D, initializeGPU, NDArray} from '../ndarray';

import {GPGPUContext} from './gpgpu_context';
import * as gpgpu_math from './gpgpu_math';
import {Pool2DProgram} from './pool_gpu';
import {TextureManager} from './texture_manager';

export function uploadPoolDownload(
    a: Float32Array, xShape: [number, number, number], fieldSize: number,
    stride: number, zeroPad: number, op: 'min'|'max'|'avg'): Float32Array {
  const gpgpu = new GPGPUContext();
  gpgpu.enableAutomaticDebugValidation(true);
  const textureManager = new TextureManager(gpgpu);
  initializeGPU(gpgpu, textureManager);

  const x = Array3D.new(xShape, a);
  const program =
      new Pool2DProgram(xShape, fieldSize, stride, zeroPad, op, false);
  const res = NDArray.zeros(program.outputShape);
  const binary = gpgpu_math.compileProgram(gpgpu, program, [x], res);
  gpgpu_math.runProgram(binary, [x], res);
  const resValues = res.getValues();

  textureManager.dispose();
  gpgpu.deleteProgram(binary.webGLProgram);
  gpgpu.dispose();
  return resValues;
}
