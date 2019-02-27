from django.urls import path
from . import views

urlpatterns = [
    path('',views.index,name='index'),
    path('mobile',views.mobile,name='mobile'),
    path('mobile_bind',views.mobile_bind,name='mobile_bind'),
    path('mobile_send',views.mobile_send,name='mobile_send'),
]
