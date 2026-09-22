#!/bin/bash
set -e
cd "$(dirname "$0")/.."
export DJANGO_SETTINGS_MODULE=apis.settings_test
python manage.py test \
  shop_online.tests.test_acceptance_customer_journey \
  shop_online.tests.test_acceptance_admin_shipper_journey \
  -v 2
