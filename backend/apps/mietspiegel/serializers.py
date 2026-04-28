from rest_framework import serializers

from .models import MietspiegelEntry


class MietspiegelEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = MietspiegelEntry
        fields = "__all__"


class MietpreisbremseCheckSerializer(serializers.Serializer):
    district = serializers.CharField()
    size_sqm = serializers.FloatField(min_value=1)
    monthly_rent_eur = serializers.DecimalField(max_digits=10, decimal_places=2)
    year_built = serializers.IntegerField(required=False)
