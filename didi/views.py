from django.shortcuts import render
from django.http import request,HttpResponse,HttpResponseRedirect
from .lib import didi
import time


# Create your views here.
def index(request):
    return HttpResponseRedirect("3")
    return HttpResponse('hello')

def detail(request,coupon_id):
 
    aBizParams = {};
    aBizParams['phone'] =  13365802535;
    aBizParams['source'] = '12';
    aBizParams['privilegeId'] = 3236;
    aBizParams['outerOrderId'] = time.time();

    didi_object =  didi.Didi()
    result = didi_object.login(aBizParams);

    # result = didi.test()
    return HttpResponse(result)

