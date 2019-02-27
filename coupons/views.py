from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse,HttpResponseRedirect
from django.template import loader
from .models import  Coupons


def index(request):
    coupon_list = list(Coupons.objects.order_by('id')[:10])
    print(coupon_list)

    # return coupon_list
    for coupon in coupon_list:
        coupon.url = '/coupons'

    context = {'coupon_list': coupon_list}
    return render(request,'coupons/index.html',context)


# 根据情况，跳转到滴滴代驾那
def detail(request, question_id):
        return HttpResponseRedirect("/")
        return HttpResponse("You're looking at question %s." % question_id)

