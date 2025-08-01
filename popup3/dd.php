$sql->query(
    "
    UPDATE {$sql->table('config')}
      SET cfg_value = :col1
    WHERE cfg_type = 'mod:board:config:{$req['id']}'
      AND cfg_key   = :col2
    ",
    array($value, $key)
);
// 설정 저장. result.php코드