#!/bin/bash
set -e
cd "$(dirname "$0")/.."
export DJANGO_SETTINGS_MODULE=apis.settings_test
python manage.py test shop_online.tests.test_unit_models shop_online.tests.test_unit_serializers -v 2
