from django.db import models

# Create your models here.
from django.db import models


class Coupons(models.Model):
    uid = models.IntegerField()
    coupon_type = models.CharField(max_length=200)
    amount = models.IntegerField()
    coupon_sn = models.CharField(max_length=30)
