window.AppNamespace = {};
$(function() {
    AppNamespace.app = new DevExpress.framework.html.HtmlApplication(
            {namespace: AppNamespace}
    );
    AppNamespace.app.router.register(":view/:rand", {view: "home", rand: ''});
    AppNamespace.app.navigate();
    AppNamespace.searchParams = [];
});
AppNamespace.home = function() {
    var viewModel = {
        phone: ko.observable(''),
        name: ko.observable(''),
        street: ko.observable(''),
        house: ko.observable(''),
        apt: ko.observable(''),
        search: function() {
            AppNamespace.searchParams = {
                phone: this.phone(),
                name: this.name(),
                street: this.street(),
                house: this.house(),
                apt: this.apt()
            }
            AppNamespace.app.navigate("search/" + Math.random());
        }
    };
    return viewModel;
};
AppNamespace.search = function() {
    var rows = search(AppNamespace.searchParams);
    var viewModel = {
        items: ko.observable(rows)
    };
    return viewModel;
};

popupVisible = ko.observable(false);
showPopup = function () {
  popupVisible(true);
};
hidePopup = function () {
  popupVisible(false);
};
