name: 'Pull Request'
description: 'Describe your changes'
title: 'type: description'
labels: []
body:
  - type: markdown
    attributes:
      value: |
        Thanks for contributing to Localcode! Please fill out the sections below.

  - type: dropdown
    id: type
    attributes:
      label: Change Type
      description: What kind of change is this?
      options:
        - feat (New feature)
        - fix (Bug fix)
        - docs (Documentation)
        - style (Formatting, no code change)
        - refactor (Code restructuring)
        - perf (Performance improvement)
        - test (Adding/updating tests)
        - chore (Build process, deps)
        - ci (CI/CD changes)
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Description
      description: What does this PR do? Why is it needed?
      placeholder: This PR adds...
    validations:
      required: true

  - type: textarea
    id: testing
    attributes:
      label: Testing
      description: How did you test these changes?
      placeholder: |
        - [ ] npm run build succeeds
        - [ ] Manual testing with Ollama
        - [ ] Manual testing with OpenAI
        - [ ] VS Code extension tested
    validations:
      required: true

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots
      description: If applicable, add screenshots or GIFs showing the changes.

  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      options:
        - label: Code compiles without errors (npm run build)
          required: true
        - label: Changes follow the project code style
          required: true
        - label: Self-review completed
          required: true
        - label: Documentation updated if needed
          required: false
        - label: No breaking changes (or documented below)
          required: false

  - type: textarea
    id: breaking
    attributes:
      label: Breaking Changes
      description: If this introduces breaking changes, describe them here.
      placeholder: None
