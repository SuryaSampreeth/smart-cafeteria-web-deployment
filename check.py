import os
import re

common_bols = [
    'visible', 'transparent', 'enabled', 'disabled', 'scrollEnabled',
    'loading', 'active', 'editable', 'secureTextEntry', 'autoCorrect',
    'showsVerticalScrollIndicator', 'showsHorizontalScrollIndicator',
    'collapsable', 'hidden', 'refreshing'
]

# regex to find prop="value" or prop='value'
pattern = re.compile(r'([a-zA-Z]+)="([^"]*)"|([a-zA-Z]+)=\'([^\']*)\'')

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            for match in pattern.finditer(content):
                prop = match.group(1) or match.group(3)
                val = match.group(2) if match.group(2) is not None else match.group(4)
                if prop in common_bols:
                    print(filepath + ': ' + prop + '="' + val + '"')
