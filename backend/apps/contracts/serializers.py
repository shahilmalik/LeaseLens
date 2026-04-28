from rest_framework import serializers

from .models import Clause, Contract


class ClauseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clause
        fields = [
            "id",
            "section",
            "category",
            "severity",
            "original_text",
            "explanation_en",
            "explanation_de",
            "recommendation_en",
            "recommendation_de",
        ]


class ContractSerializer(serializers.ModelSerializer):
    clauses = ClauseSerializer(many=True, read_only=True)

    class Meta:
        model = Contract
        fields = [
            "id",
            "file",
            "original_filename",
            "extracted_text",
            "score",
            "uploaded_at",
            "clauses",
        ]
        read_only_fields = ["extracted_text", "score", "uploaded_at", "clauses"]
