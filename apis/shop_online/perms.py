from rest_framework import permissions
from shop_online.models import UserRole

class IsCustomer(permissions.BasePermission):
    def has_permission(self, request,view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.CUSTOMER

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.ADMIN

class IsShipper(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.SHIPPER

class IsCustomerOrShipper(permissions.BasePermission):
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and request.user.role in [UserRole.CUSTOMER, UserRole.SHIPPER])

class IsAdminOrShipper(permissions.BasePermission):
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and request.user.role in [UserRole.ADMIN, UserRole.SHIPPER])

class AddressCustomerOwner(IsCustomer):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class OrderItemCustomerOwner(IsCustomer):
    def has_object_permission(self, request, view, obj):
        return obj.order.user == request.user

class CartItemCustomerOwner(IsCustomer):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class RoomAccess(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.ADMIN:
            return True
        if request.user.role == UserRole.CUSTOMER or request.user.role == UserRole.SHIPPER :
            return obj.customer == request.user
        return False

class OrderAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.ADMIN:
            return True
        if request.user.role == UserRole.SHIPPER:
            return obj.shipper == request.user
        return obj.user == request.user