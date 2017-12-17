#!/usr/bin/env bash
cd examples/react-component
npm link ../../
cd -

cd examples/example-choice
npm link ../../
cd -

cd examples/demo-project
npm link ../../
npm link ../react-component
npm link ../example-choice
cd -