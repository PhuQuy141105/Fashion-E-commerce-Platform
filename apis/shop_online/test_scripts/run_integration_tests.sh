#!/bin/bash
set -e
cd "$(dirname "$0")/.."
export DJANGO_SETTINGS_MODULE=apis.settings_test
python manage.py test \
  shop_online.tests.test_integration_auth_products \
  shop_online.tests.test_integration_cart_checkout \
  shop_online.tests.test_integration_orders_lifecycle \
  shop_online.tests.test_integration_reviews_vouchers \
  shop_online.tests.test_integration_cod_shipper \
  -v 2
