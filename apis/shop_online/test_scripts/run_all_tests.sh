#!/bin/bash
set -e
cd "$(dirname "$0")"
bash run_unit_tests.sh
bash run_integration_tests.sh
bash run_acceptance_tests.sh
