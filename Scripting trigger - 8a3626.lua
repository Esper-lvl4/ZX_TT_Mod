function onObjectEnterZone(zone, object_entering)
  if zone == self then
    object_entering.addTag("BlueCard")
    if object_entering.hasTag("RedCard") then
      object_entering.removeTag("RedCard")
    end
  end
end
  
function onObjectLeaveContainer(container, leave_object)
  if container.type == "Deck" then
    leave_object.addTag("BlueCard")
  end
end