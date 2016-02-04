# Sim-City-Directive
Sim-City-Directive

```
<sim-form schemaurl="http://url_for_your_schema/"></sim-form>
```

This is how you register your custom points:
```
angular
  .module('simCitySimDirective')
  .run(runBlock);

function runBlock($log, SchemaService) {
  SchemaService.addCustomTypeHandler('point2d', function(schema, form) {
    schema['items'] = { 'type': 'object' };
    form['type'] = 'template';
    form['template'] = '<div>Point 2D template!</div>';
  });
}
```
