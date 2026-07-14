from copy import copy

from django.template.context import BaseContext


def patch_template_context_copy():
    """
    Django 5.1's BaseContext.__copy__ uses copy(super()), which raises
    AttributeError on Python 3.14 while rendering admin inclusion tags.
    """
    if getattr(BaseContext, "_python314_copy_patch", False):
        return

    def compatible_copy(self):
        duplicate = self.__class__.__new__(self.__class__)
        duplicate.__dict__.update(self.__dict__)
        duplicate.dicts = self.dicts[:]
        if hasattr(self, "render_context"):
            duplicate.render_context = copy(self.render_context)
        return duplicate

    BaseContext.__copy__ = compatible_copy
    BaseContext._python314_copy_patch = True
