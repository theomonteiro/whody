-- Cada pista passa a ter uma lista de fontes (fato surpreendente, número ou citação pede 2).
alter table clues add column source_urls text[] not null default '{}';
update clues set source_urls = array[source_url] where source_url is not null;
alter table clues drop column source_url;
