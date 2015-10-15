<?php
    if (isset($_GET['f']) && $_GET['f'] !== '')
    {
        $filename = $_GET['f'];
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Phaser Nano - <?php echo $filename ?></title>
    <script src="../src/Game.js"></script>
    <script src="../src/WebGL.js"></script>
    <script src="../src/Canvas.js"></script>
    <script src="../src/Loader.js"></script>
    <script src="../src/Cache.js"></script>
    <script src="../src/Texture.js"></script>
    <script src="../src/Sprite.js"></script>
    <script src="../src/Matrix.js"></script>
    <script src="../src/Geometry.js"></script>
    <script src="../src/Frame.js"></script>
    <script src="../src/FrameData.js"></script>
    <script src="../src/Group.js"></script>
    <script src="../src/Layer.js"></script>
    <script src="../src/Factory.js"></script>
    <style type="text/css">
        body {
            margin: 0;
        }
    </style>
</head>

<body>

    <script type="text/javascript" charset="utf-8">
    <?php
        if ($filename !== '')
        {
            $src = file_get_contents("src/$filename");
            echo $src;
        }
    ?>
    </script>

</body>
</html>