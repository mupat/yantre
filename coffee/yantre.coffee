$ ->
  options = new Options ->
    window.options = options

    basic = new Basic()
    app = new App()
    mail = new Mail()
    clock = new Clock()

    app.render()
    mail.render()
    clock.render()