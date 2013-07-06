class OptionsView
  template: YANTRE.templates.option
  $el: $('#options')
  # rendered: false

  constructor: (@options = YANTRE.options) ->
    @_registerBtnClick()
    @_registerTabChange()
    @_registerInputChange()
    @_registerOptionChange()

  render: ->
    # unless @rendered
    data = 
      darkFont: { name: @options.DARK_FONT, value: Boolean(@options.get(@options.DARK_FONT)) }
      grayApps: { name: @options.APP_GRAYSCALE, value: Boolean(@options.get(@options.APP_GRAYSCALE)) }
      theme: @options.THEME_KEY
      themes: {}

    for theme in @options.THEMES
      data.themes[theme.name] =
        class: theme.name
        name: @_prettify(theme.name)
        grayApps: Boolean(theme.grayApps)
        darkFont: Boolean(theme.darkFont)
        value: Boolean(@options.get(@options.THEME_KEY) is theme.name)

    # @rendered = true
    @$el.html @template data

  _registerTabChange: ->
    @$el.on 'click', 'i', (e) =>
      $target = $(e.target)
      id = $target.attr 'data-content'
      @$el.find('.show').removeClass 'show'
      @$el.find('.active').removeClass 'active'
      $("##{id}").addClass 'show'
      $target.addClass 'active'

  _registerBtnClick: ->
    @$el.on 'mousedown', (e) -> e.stopPropagation()
    $('#options_btn').on 'click', =>
      $(document).one 'mousedown', (e) =>
        id = $(e.target).attr 'id'
        if id != 'options_btn' then @$el.removeClass 'show'
    
      @$el.toggleClass 'show'

  _registerInputChange: ->
    @$el.on 'change', 'input', (e) =>
      if e.target.name is @options.THEME_KEY then value = e.target.value else value = e.target.checked
      @options.set e.target.name, value, =>
        $target = $(e.target).parent()
        
        if e.target.name is @options.THEME_KEY
          @_set_theme_options e.target.value

  _set_theme_options: (input_value) ->
    for theme in @options.THEMES
      if theme.name is input_value
        darkFont = Boolean(theme.darkFont)
        grayApps = Boolean(theme.grayApps)
        break;
        
    @options.set @options.DARK_FONT, darkFont
    @options.set @options.APP_GRAYSCALE, grayApps

  _registerOptionChange: ->
    @options.registerOnChange @options.APP_GRAYSCALE, (new_value, old_value) =>
      @$el.find("##{@options.APP_GRAYSCALE}").prop 'checked', new_value

    @options.registerOnChange @options.DARK_FONT, (new_value, old_value) =>
      @$el.find("##{@options.DARK_FONT}").prop 'checked', new_value

    @options.registerOnChange @options.THEME_KEY, (new_value, old_value) =>
      @$el.find("##{@options.THEME_KEY}").prop 'checked', new_value

  _prettify: (value) ->
    value.replace(
      /([a-z])([A-Z])/g, 
      (match, l1, l2) -> "#{l1} #{l2}"
    ).toLowerCase()