from django.db import models


class FaqItem(models.Model):
    """
    FAQ item.
    Matches the FaqItem interface in frontend/src/mock-data.ts.
    """
    question = models.CharField(max_length=300, verbose_name="Question")
    answer_items = models.JSONField(
        default=list,
        verbose_name="Answers",
        help_text="List of strings: [\"answer 1\", \"answer 2\", ...]",
    )
    order = models.PositiveIntegerField(default=0, verbose_name="Order")
    is_active = models.BooleanField(default=True, verbose_name="Active")

    class Meta:
        verbose_name = "Question FAQ"
        verbose_name_plural = "FAQ"
        ordering = ["order"]

    def __str__(self):
        return self.question
