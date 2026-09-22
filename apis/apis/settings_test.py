from .settings import *
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
GDAL_LIBRARY_PATH = r"C:\Users\Admin\AppData\Local\Programs\OSGeo4W\bin\gdal313.dll"
GEOS_LIBRARY_PATH = r"C:\Users\Admin\AppData\Local\Programs\OSGeo4W\bin\geos_c.dll"